import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { resolveJwtSecret } from '@campus-connect/common';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';

type ActiveCall = {
  callerId: string;
  calleeId: string;
  createdAt: number;
};

const conversationRoom = (id: string) => `conversation:${id}`;
const userRoom = (id: string) => `user:${id}`;

function parseSocketOrigins(): string[] | boolean {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || raw.trim() === '') return true; // dev: allow all
  if (raw.trim() === '*') return true;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: parseSocketOrigins(), credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly activeCalls = new Map<string, ActiveCall>();

  constructor(
    private readonly chatService: ChatService,
    private readonly presence: PresenceService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verify the JWT from the handshake and return the authenticated userId.
   * Token can arrive via HttpOnly cookie, `auth.token`, Authorization header,
   * or `?token=` during the compatibility window.
   * Returns null when the token is missing/invalid.
   */
  private authenticate(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    const headerToken = client.handshake.headers?.authorization?.replace(
      /^Bearer\s+/i,
      '',
    );
    const queryToken = client.handshake.query.token as string | undefined;
    const cookieToken = client.handshake.headers?.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('access_token='));
    const token = cookieToken
      ? decodeURIComponent(cookieToken.slice('access_token='.length))
      : auth?.token || headerToken || queryToken;
    if (!token) return null;

    try {
      const payload = this.jwtService.verify(token, {
        secret: resolveJwtSecret(),
      });
      return (payload?.sub as string) || null;
    } catch {
      return null;
    }
  }

  /**
   * Simple per-socket fixed-window rate limiter for WS events. Counters live on
   * the socket itself, so they die with the connection. Returns false when the
   * caller has exceeded `limit` events within `windowMs`.
   */
  private allow(
    client: Socket,
    event: string,
    limit: number,
    windowMs: number,
  ): boolean {
    const now = Date.now();
    const store: Record<string, { count: number; resetAt: number }> =
      (client.data.__rl ??= {});
    let c = store[event];
    if (!c || c.resetAt <= now) {
      c = { count: 0, resetAt: now + windowMs };
      store[event] = c;
    }
    c.count += 1;
    return c.count <= limit;
  }

  private callKey(userA: string, userB: string): string {
    return [userA, userB].sort().join(':');
  }

  private currentUserId(client: Socket): string {
    const userId = client.data?.userId as string | undefined;
    if (!userId) throw new WsException('UNAUTHORIZED');
    return userId;
  }

  private async assertConversationAccess(
    conversationId: string,
    userId: string,
  ) {
    await this.chatService.assertConversationMemberAccess(
      conversationId,
      userId,
    );
  }

  private pruneStaleCalls() {
    const now = Date.now();
    for (const [key, call] of this.activeCalls) {
      if (now - call.createdAt > 60_000) this.activeCalls.delete(key);
    }
  }

  /**
   * Clients connect with a JWT (handshake auth/header/query). We verify it and
   * derive the userId from the token — never trust a client-supplied userId.
   */
  async handleConnection(client: Socket) {
    const userId = this.authenticate(client);
    if (!userId) {
      // Reject unauthenticated sockets.
      console.warn(
        `[ChatSocket] Rejecting unauthenticated socket ${client.id}: missing or invalid access token`,
      );
      client.emit('unauthorized', { message: 'Token không hợp lệ hoặc thiếu' });
      client.disconnect(true);
      return;
    }
    const justCameOnline = await this.presence.add(userId, client.id);
    client.data.userId = userId;
    await client.join(userRoom(userId));
    // Send the current online list to the newcomer.
    const online = await this.presence.onlineUserIds();
    client.emit('onlineUsers', online);
    if (justCameOnline) {
      this.server.emit('presence', { userId, status: 'online' });
    }
  }

  async handleDisconnect(client: Socket) {
    const { userId, nowOffline } = await this.presence.remove(client.id);
    if (userId && nowOffline) {
      this.server.emit('presence', { userId, status: 'offline' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      receiverId?: string;
      content: string;
      messageType?: string;
      mediaUrl?: string;
      replyToId?: string;
    },
  ) {
    // Per-socket flood protection.
    if (!this.allow(client, 'sendMessage', 20, 10_000)) {
      return { status: 'error', message: 'Gửi quá nhanh, vui lòng chậm lại' };
    }
    // Trust the authenticated userId from the socket, not the client payload.
    const senderId = client.data?.userId as string;
    if (!senderId) {
      return { status: 'error', message: 'Token không hợp lệ hoặc thiếu' };
    }
    await this.assertConversationAccess(data.conversationId, senderId);

    const message = await this.chatService.saveMessage(
      data.conversationId,
      senderId,
      data.content,
      data.messageType,
      data.mediaUrl,
      data.replyToId,
    );

    this.server
      .to(conversationRoom(data.conversationId))
      .emit(`conversation-${data.conversationId}`, message);
    const conversation = await this.chatService.getConversationById(
      data.conversationId,
      senderId,
    );
    for (const member of conversation.members) {
      if (member.userId === senderId) continue;
      this.server
        .to(userRoom(member.userId))
        .emit(`receiveMessage-${member.userId}`, message);

      // Notify authenticated conversation members even if they are not
      // currently viewing this conversation. Never trust receiverId supplied
      // by the client; it could target an unrelated user.
      this.server
        .to(userRoom(member.userId))
        .emit(`notification-${member.userId}`, {
          type: 'MESSAGE',
          // Field name `message` mirrors GET /notifications + FE NotificationItem.
          message: `Tin nhắn mới từ ${message.sender?.fullName ?? 'ai đó'}`,
          relatedId: data.conversationId,
          createdAt: message.createdAt,
        });
    }

    return { status: 'success', data: message };
  }

  /** FE `/messages` UI uses snake_case events. Keep old camelCase events too. */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId)
      return { status: 'error', message: 'Thiếu conversationId' };
    const userId = this.currentUserId(client);
    await this.assertConversationAccess(data.conversationId, userId);
    await client.join(conversationRoom(data.conversationId));
    return { status: 'success' };
  }

  @SubscribeMessage('send_message')
  async handleSendMessageAlias(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      type?: string;
      mediaUrl?: string;
      replyToId?: string;
      tempId?: string;
    },
  ) {
    if (!this.allow(client, 'send_message', 20, 10_000)) {
      return { status: 'error', message: 'Gửi quá nhanh, vui lòng chậm lại' };
    }

    const senderId = this.currentUserId(client);
    await this.assertConversationAccess(data.conversationId, senderId);
    const message = await this.chatService.saveMessage(
      data.conversationId,
      senderId,
      data.content,
      data.type,
      data.mediaUrl,
      data.replyToId,
      data.tempId,
    );

    const payload = {
      conversationId: data.conversationId,
      message,
      tempId: data.tempId,
    };
    this.server
      .to(conversationRoom(data.conversationId))
      .emit('new_message', payload);
    this.server
      .to(conversationRoom(data.conversationId))
      .emit(`conversation-${data.conversationId}`, message);

    const conversation = await this.chatService.getConversationById(
      data.conversationId,
      senderId,
    );
    for (const member of conversation.members) {
      if (member.userId === senderId) continue;
      this.server
        .to(userRoom(member.userId))
        .emit(`receiveMessage-${member.userId}`, message);
    }

    return { status: 'success', data: { message, tempId: data.tempId } };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; userId: string; isTyping: boolean },
  ) {
    if (!this.allow(client, 'typing', 30, 10_000)) return;
    const userId = this.currentUserId(client);
    await this.assertConversationAccess(data.conversationId, userId);
    await this.presence.setTyping(data.conversationId, userId, data.isTyping);
    const typingUsers = await this.presence.typingUsers(data.conversationId);
    this.server
      .to(conversationRoom(data.conversationId))
      .emit(`typing-${data.conversationId}`, {
        conversationId: data.conversationId,
        typingUsers,
      });
  }

  @SubscribeMessage('messageDelivered')
  async handleDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    const userId = this.currentUserId(client);
    const message = await this.chatService.markDelivered(
      data.messageId,
      userId,
    );
    this.server
      .to(conversationRoom(message.conversationId))
      .emit(`messageStatus-${message.conversationId}`, {
        messageId: data.messageId,
        status: 'DELIVERED',
      });
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    const userId = this.currentUserId(client);
    const result = await this.chatService.markConversationRead(
      data.conversationId,
      userId,
    );
    this.server
      .to(conversationRoom(data.conversationId))
      .emit(`messageStatus-${data.conversationId}`, {
        status: 'READ',
        readerId: userId,
        updated: result.updated,
        messageIds: result.messageIds,
      });
    return { status: 'success', ...result };
  }

  @SubscribeMessage('recallMessage')
  async handleRecallMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      userId: string;
      conversationId: string;
      receiverId?: string;
    },
  ) {
    const userId = this.currentUserId(client);
    const message = await this.chatService.recallMessage(
      data.messageId,
      userId,
    );
    if (!message)
      return { status: 'error', message: 'Unauthorized or not found' };

    this.server
      .to(conversationRoom(message.conversationId))
      .emit(`messageRecalled`, {
        conversationId: message.conversationId,
        messageId: data.messageId,
        message,
      });
    return { status: 'success', data: message };
  }

  @SubscribeMessage('unsend_message')
  async handleUnsendMessageAlias(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId?: string },
  ) {
    const userId = this.currentUserId(client);
    const message = await this.chatService.recallMessage(
      data.messageId,
      userId,
    );
    if (!message)
      return { status: 'error', message: 'Unauthorized or not found' };

    const payload = {
      conversationId: message.conversationId,
      messageId: data.messageId,
      message,
    };
    this.server
      .to(conversationRoom(payload.conversationId))
      .emit('message_unsent', payload);
    this.server
      .to(conversationRoom(payload.conversationId))
      .emit('messageRecalled', payload);
    return { status: 'success', data: message };
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId: string; conversationId: string; content: string },
  ) {
    const userId = this.currentUserId(client);
    const message = await this.chatService.editMessage(
      data.messageId,
      userId,
      data.content,
    );
    if (!message)
      return { status: 'error', message: 'Unauthorized or not found' };

    const payload = {
      conversationId: message.conversationId,
      messageId: data.messageId,
      changes: { content: message.content, updatedAt: message.updatedAt },
      message,
    };
    this.server
      .to(conversationRoom(payload.conversationId))
      .emit('message_updated', payload);
    return { status: 'success', data: message };
  }

  @SubscribeMessage('forward_message')
  async handleForwardMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId: string; targetConversationId: string; tempId?: string },
  ) {
    const userId = this.currentUserId(client);
    const message = await this.chatService.forwardMessage(
      data.messageId,
      userId,
      data.targetConversationId,
    );
    if (!message)
      return { status: 'error', message: 'Không thể chuyển tiếp tin nhắn' };

    const payload = {
      conversationId: data.targetConversationId,
      message,
      tempId: data.tempId,
    };
    this.server
      .to(conversationRoom(message.conversationId))
      .emit('new_message', payload);
    return { status: 'success', data: { message, tempId: data.tempId } };
  }

  @SubscribeMessage('delete_message_for_me')
  async handleDeleteMessageForMe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = this.currentUserId(client);
    await this.chatService.deleteMessageForMe(data.messageId, userId);
    client.emit('message_deleted_for_me', {
      messageId: data.messageId,
      userId,
    });
    return { status: 'success' };
  }

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      userId: string;
      emoji: string;
      conversationId: string;
    },
  ) {
    const userId = this.currentUserId(client);
    const reaction = await this.chatService.addReaction(
      data.messageId,
      userId,
      data.emoji,
    );
    const message = await this.chatService.getMessageForMember(
      data.messageId,
      userId,
    );
    this.server
      .to(conversationRoom(message.conversationId))
      .emit(`reactionAdded-${message.conversationId}`, {
        messageId: data.messageId,
        reaction,
      });
    return { status: 'success', data: reaction };
  }

  @SubscribeMessage('react_message')
  async handleReactMessageAlias(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId: string; reactionType: string; conversationId?: string },
  ) {
    const userId = this.currentUserId(client);
    const reaction = await this.chatService.addReaction(
      data.messageId,
      userId,
      data.reactionType,
    );
    const message = await this.chatService.getMessageForMember(
      data.messageId,
      userId,
    );
    const payload = {
      conversationId: message.conversationId,
      messageId: data.messageId,
      reaction: {
        ...reaction,
        reactionType: data.reactionType,
        type: data.reactionType,
      },
    };
    this.server
      .to(conversationRoom(message.conversationId))
      .emit('message_reacted', payload);
    this.server
      .to(conversationRoom(message.conversationId))
      .emit(`reactionAdded-${message.conversationId}`, payload);
    return { status: 'success', data: reaction };
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      userId: string;
      emoji: string;
      conversationId: string;
    },
  ) {
    const userId = this.currentUserId(client);
    await this.chatService.removeReaction(data.messageId, userId, data.emoji);
    const message = await this.chatService.getMessageForMember(
      data.messageId,
      userId,
    );
    this.server
      .to(conversationRoom(message.conversationId))
      .emit(`reactionRemoved-${message.conversationId}`, {
        messageId: data.messageId,
        userId,
        emoji: data.emoji,
      });
    return { status: 'success' };
  }

  @SubscribeMessage('remove_reaction')
  async handleRemoveReactionAlias(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { messageId: string; reactionType?: string; conversationId?: string },
  ) {
    const userId = this.currentUserId(client);
    await this.chatService.removeReaction(
      data.messageId,
      userId,
      data.reactionType ?? '',
    );
    const message = await this.chatService.getMessageForMember(
      data.messageId,
      userId,
    );
    const payload = {
      conversationId: message.conversationId,
      messageId: data.messageId,
      userId,
    };
    this.server
      .to(conversationRoom(message.conversationId))
      .emit('reaction_removed', payload);
    this.server
      .to(conversationRoom(message.conversationId))
      .emit(`reactionRemoved-${message.conversationId}`, payload);
    return { status: 'success' };
  }

  /** Allow other services to push a realtime notification to a user. */
  pushNotification(userId: string, payload: unknown) {
    this.server.to(userRoom(userId)).emit(`notification-${userId}`, payload);
  }

  async revokeConversationRoom(userId: string, conversationId: string) {
    const sockets = await this.server.in(userRoom(userId)).fetchSockets();
    sockets.forEach((socket) => socket.leave(conversationRoom(conversationId)));
  }

  // --- WebRTC Signaling Events for Video/Voice Calls ---

  @SubscribeMessage('callUser')
  async handleCallUser(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userToCall: string;
      signalData: any;
      from: string;
      isVideo: boolean;
      callerName: string;
      callerAvatar?: string;
      conversationId?: string;
    },
  ) {
    if (!this.allow(client, 'callUser', 10, 10_000)) return;
    const from = this.currentUserId(client);
    if (!data?.userToCall || !data.signalData) {
      return { status: 'error', message: 'Thiếu dữ liệu cuộc gọi' };
    }
    let conversationId = data.conversationId;
    if (conversationId) {
      await this.assertConversationAccess(conversationId, from);
      await this.assertConversationAccess(conversationId, data.userToCall);
    } else {
      const conversation = await this.chatService.getOrCreateDirectConversation(
        from,
        data.userToCall,
      );
      conversationId = conversation.id;
    }

    this.pruneStaleCalls();
    const activeCallKey = this.callKey(from, data.userToCall);
    // Do not reject a reverse call between the same users here. Both clients
    // can start at nearly the same time (WebRTC glare); the client-side
    // deterministic user-id tie-breaker selects one caller. Rejecting the
    // second signal prevented that resolver from running and incorrectly
    // displayed "Người nhận đang bận" to one participant.
    this.activeCalls.set(activeCallKey, {
      callerId: from,
      calleeId: data.userToCall,
      createdAt: Date.now(),
    });

    const isOnline = await this.presence.isOnline(data.userToCall);
    if (!isOnline) {
      this.activeCalls.delete(activeCallKey);
      client.emit(`callUnavailable-${from}`, { to: data.userToCall });
      return { status: 'error', message: 'Người nhận không online' };
    }

    const payload = {
      signal: data.signalData,
      from,
      callerName: data.callerName,
      callerAvatar: data.callerAvatar,
      isVideo: data.isVideo,
      conversationId,
    };
    this.server
      .to(userRoom(data.userToCall))
      .emit(`receiveCall-${data.userToCall}`, payload);
    const callMessage = await this.chatService.createCallMessage(
      conversationId,
      from,
      data.isVideo,
    );
    if (conversationId) {
      await this.chatService.startCallSession(
        conversationId,
        from,
        data.isVideo,
      );
    }
    if (callMessage && conversationId) {
      this.server.to(conversationRoom(conversationId)).emit('new_message', {
        conversationId,
        message: callMessage,
      });
    }
    return { status: 'success' };
  }

  @SubscribeMessage('answerCall')
  handleAnswerCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; signal: any },
  ) {
    const from = this.currentUserId(client);
    if (from && data.to) this.activeCalls.delete(this.callKey(from, data.to));
    this.server.to(userRoom(data.to)).emit(`callAccepted-${data.to}`, {
      signal: data.signal,
      from,
    });
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; candidate: any },
  ) {
    const from = this.currentUserId(client);
    this.server.to(userRoom(data.to)).emit(`iceCandidate-${data.to}`, {
      candidate: data.candidate,
      from,
    });
  }

  @SubscribeMessage('endCall')
  handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string },
  ) {
    const from = this.currentUserId(client);
    if (from && data.to) this.activeCalls.delete(this.callKey(from, data.to));
    this.server.to(userRoom(data.to)).emit(`callEnded-${data.to}`, { from });
  }

  @SubscribeMessage('rejectCall')
  handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string },
  ) {
    const from = this.currentUserId(client);
    if (from && data.to) this.activeCalls.delete(this.callKey(from, data.to));
    this.server.to(userRoom(data.to)).emit(`callRejected-${data.to}`, { from });
  }

  @SubscribeMessage('callBusy')
  handleCallBusy(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string },
  ) {
    this.currentUserId(client);
    if (!data?.to) return { status: 'error', message: 'Thiếu người gọi' };

    // A user room can contain several browser tabs/devices. One stale or busy
    // socket must not reject a call on behalf of every other socket that may
    // still accept it. Keep the pending call alive; an available socket can
    // answer, while a truly unanswered call is closed by the caller timeout.
    return { status: 'ignored', message: 'Busy is resolved per user timeout' };
  }
}

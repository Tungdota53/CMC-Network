import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { resolveJwtSecret } from '@campus-connect/common';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';

function parseSocketOrigins(): string[] | boolean {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || raw.trim() === '') return true; // dev: allow all
  if (raw.trim() === '*') return true;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

@WebSocketGateway({ cors: { origin: parseSocketOrigins(), credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly presence: PresenceService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verify the JWT from the handshake and return the authenticated userId.
   * Token can arrive via `auth.token`, `Authorization` header, or `?token=`.
   * Returns null when the token is missing/invalid.
   */
  private authenticate(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    const headerToken = client.handshake.headers?.authorization?.replace(
      /^Bearer\s+/i,
      '',
    );
    const queryToken = client.handshake.query.token as string | undefined;
    const token = auth?.token || headerToken || queryToken;
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

  /**
   * Clients connect with a JWT (handshake auth/header/query). We verify it and
   * derive the userId from the token — never trust a client-supplied userId.
   */
  async handleConnection(client: Socket) {
    const userId = this.authenticate(client);
    if (!userId) {
      // Reject unauthenticated sockets.
      client.emit('unauthorized', { message: 'Token không hợp lệ hoặc thiếu' });
      client.disconnect(true);
      return;
    }
    const justCameOnline = await this.presence.add(userId, client.id);
    client.data.userId = userId;
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
    const senderId = (client.data?.userId as string) || data.senderId;

    const message = await this.chatService.saveMessage(
      data.conversationId,
      senderId,
      data.content,
      data.messageType,
      data.mediaUrl,
      data.replyToId,
    );

    this.server.emit(`conversation-${data.conversationId}`, message);
    if (data.receiverId)
      this.server.emit(`receiveMessage-${data.receiverId}`, message);

    // Notify recipient even if they aren't viewing the conversation.
    if (data.receiverId) {
      this.server.emit(`notification-${data.receiverId}`, {
        type: 'MESSAGE',
        // Field name `message` mirrors GET /notifications + FE NotificationItem.
        message: `Tin nhắn mới từ ${message.sender?.fullName ?? 'ai đó'}`,
        relatedId: data.conversationId,
        createdAt: message.createdAt,
      });
    }

    return { status: 'success', data: message };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; userId: string; isTyping: boolean },
  ) {
    if (!this.allow(client, 'typing', 30, 10_000)) return;
    await this.presence.setTyping(
      data.conversationId,
      data.userId,
      data.isTyping,
    );
    const typingUsers = await this.presence.typingUsers(data.conversationId);
    this.server.emit(`typing-${data.conversationId}`, {
      conversationId: data.conversationId,
      typingUsers,
    });
  }

  @SubscribeMessage('messageDelivered')
  async handleDelivered(
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    await this.chatService.markDelivered(data.messageId);
    this.server.emit(`messageStatus-${data.conversationId}`, {
      messageId: data.messageId,
      status: 'DELIVERED',
    });
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    const result = await this.chatService.markConversationRead(
      data.conversationId,
      data.userId,
    );
    this.server.emit(`messageStatus-${data.conversationId}`, {
      status: 'READ',
      readerId: data.userId,
      updated: result.updated,
    });
    return { status: 'success', ...result };
  }

  @SubscribeMessage('recallMessage')
  async handleRecallMessage(
    @MessageBody()
    data: {
      messageId: string;
      userId: string;
      conversationId: string;
      receiverId?: string;
    },
  ) {
    const message = await this.chatService.recallMessage(
      data.messageId,
      data.userId,
    );
    if (!message)
      return { status: 'error', message: 'Unauthorized or not found' };

    this.server.emit(`messageRecalled`, {
      conversationId: data.conversationId,
      messageId: data.messageId,
      message,
    });
    return { status: 'success', data: message };
  }

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @MessageBody()
    data: {
      messageId: string;
      userId: string;
      emoji: string;
      conversationId: string;
    },
  ) {
    const reaction = await this.chatService.addReaction(
      data.messageId,
      data.userId,
      data.emoji,
    );
    this.server.emit(`reactionAdded-${data.conversationId}`, {
      messageId: data.messageId,
      reaction,
    });
    return { status: 'success', data: reaction };
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @MessageBody()
    data: {
      messageId: string;
      userId: string;
      emoji: string;
      conversationId: string;
    },
  ) {
    await this.chatService.removeReaction(
      data.messageId,
      data.userId,
      data.emoji,
    );
    this.server.emit(`reactionRemoved-${data.conversationId}`, {
      messageId: data.messageId,
      userId: data.userId,
      emoji: data.emoji,
    });
    return { status: 'success' };
  }

  /** Allow other services to push a realtime notification to a user. */
  pushNotification(userId: string, payload: unknown) {
    this.server.emit(`notification-${userId}`, payload);
  }

  // --- WebRTC Signaling Events for Video/Voice Calls ---

  @SubscribeMessage('callUser')
  handleCallUser(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userToCall: string;
      signalData: any;
      from: string;
      isVideo: boolean;
      callerName: string;
      callerAvatar?: string;
    },
  ) {
    if (!this.allow(client, 'callUser', 10, 10_000)) return;
    this.server.emit(`receiveCall-${data.userToCall}`, {
      signal: data.signalData,
      from: data.from,
      callerName: data.callerName,
      callerAvatar: data.callerAvatar,
      isVideo: data.isVideo,
    });
  }

  @SubscribeMessage('answerCall')
  handleAnswerCall(@MessageBody() data: { to: string; signal: any }) {
    this.server.emit(`callAccepted-${data.to}`, data.signal);
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(@MessageBody() data: { to: string; candidate: any }) {
    this.server.emit(`iceCandidate-${data.to}`, data.candidate);
  }

  @SubscribeMessage('endCall')
  handleEndCall(@MessageBody() data: { to: string }) {
    this.server.emit(`callEnded-${data.to}`);
  }
}

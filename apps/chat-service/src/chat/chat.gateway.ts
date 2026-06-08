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
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';

function parseSocketOrigins(): string[] | boolean {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || raw.trim() === '') return true; // dev: allow all
  if (raw.trim() === '*') return true;
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

@WebSocketGateway({ cors: { origin: parseSocketOrigins(), credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly presence: PresenceService,
  ) {}

  /**
   * Clients connect with ?userId=<id> in the socket handshake query so we can
   * track presence. (Auth token verification can be layered on later.)
   */
  handleConnection(client: Socket) {
    const userId = (client.handshake.query.userId as string) || '';
    if (!userId) return;
    const justCameOnline = this.presence.add(userId, client.id);
    client.data.userId = userId;
    // Send the current online list to the newcomer.
    client.emit('onlineUsers', this.presence.onlineUserIds());
    if (justCameOnline) {
      this.server.emit('presence', { userId, status: 'online' });
    }
  }

  handleDisconnect(client: Socket) {
    const { userId, nowOffline } = this.presence.remove(client.id);
    if (userId && nowOffline) {
      this.server.emit('presence', { userId, status: 'offline' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { conversationId: string; senderId: string; receiverId?: string; content: string; messageType?: string; mediaUrl?: string },
  ) {
    const message = await this.chatService.saveMessage(
      data.conversationId,
      data.senderId,
      data.content,
      data.messageType,
      data.mediaUrl,
    );

    this.server.emit(`conversation-${data.conversationId}`, message);
    if (data.receiverId) this.server.emit(`receiveMessage-${data.receiverId}`, message);

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
  handleTyping(
    @MessageBody() data: { conversationId: string; userId: string; isTyping: boolean },
  ) {
    this.presence.setTyping(data.conversationId, data.userId, data.isTyping);
    this.server.emit(`typing-${data.conversationId}`, {
      conversationId: data.conversationId,
      typingUsers: this.presence.typingUsers(data.conversationId),
    });
  }

  @SubscribeMessage('messageDelivered')
  async handleDelivered(@MessageBody() data: { messageId: string; conversationId: string }) {
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
    const result = await this.chatService.markConversationRead(data.conversationId, data.userId);
    this.server.emit(`messageStatus-${data.conversationId}`, {
      status: 'READ',
      readerId: data.userId,
      updated: result.updated,
    });
    return { status: 'success', ...result };
  }

  @SubscribeMessage('recallMessage')
  async handleRecallMessage(
    @MessageBody() data: { messageId: string; userId: string; conversationId: string; receiverId?: string },
  ) {
    const message = await this.chatService.recallMessage(data.messageId, data.userId);
    if (!message) return { status: 'error', message: 'Unauthorized or not found' };

    this.server.emit(`messageRecalled`, { conversationId: data.conversationId, messageId: data.messageId, message });
    return { status: 'success', data: message };
  }

  /** Allow other services to push a realtime notification to a user. */
  pushNotification(userId: string, payload: unknown) {
    this.server.emit(`notification-${userId}`, payload);
  }

  // --- WebRTC Signaling Events for Video/Voice Calls ---

  @SubscribeMessage('callUser')
  handleCallUser(@MessageBody() data: { userToCall: string; signalData: any; from: string; isVideo: boolean; callerName: string; callerAvatar?: string }) {
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

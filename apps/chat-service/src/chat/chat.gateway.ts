import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { conversationId: string; senderId: string; receiverId?: string; content: string; messageType?: string; mediaUrl?: string },
  ) {
    const message = await this.chatService.saveMessage(data.conversationId, data.senderId, data.content, data.messageType, data.mediaUrl);

    this.server.emit(`conversation-${data.conversationId}`, message);
    if (data.receiverId) this.server.emit(`receiveMessage-${data.receiverId}`, message);

    return { status: 'success', data: message };
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

import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  JwtAuthGuard,
  VerifiedUserGuard,
} from '@campus-connect/common';
import 'multer';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { LiveKitService } from './livekit.service';
import { WebrtcService } from './webrtc.service';
import { createHash, timingSafeEqual } from 'crypto';

function safeSecretEquals(actual: string, expected: string): boolean {
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly liveKitService: LiveKitService,
    private readonly webrtcService: WebrtcService,
  ) {}

  /** Return short-lived ICE servers for WebRTC calls. */
  @Get('webrtc/ice-servers')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  getIceServers(@CurrentUser('sub') userId: string) {
    return this.webrtcService.getIceServers(userId);
  }

  /** Upload media file (image/video/file) for chat messages. */
  @Post('upload')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.uploadFile(file);
  }

  /** Internal hook: other services push realtime notifications through here. */
  @Post('internal/notify')
  internalNotify(
    @Headers('x-internal-secret') internalSecret: string | undefined,
    @Body()
    body: {
      userId: string;
      type: string;
      content?: string;
      message?: string;
      relatedId?: string;
    } = { userId: '', type: '' },
  ) {
    const configuredSecrets = (process.env.INTERNAL_NOTIFY_SECRETS || '')
      .split(',')
      .map((secret) => secret.trim())
      .filter(Boolean);

    if (
      configuredSecrets.length === 0 ||
      !internalSecret ||
      !configuredSecrets.some((secret) =>
        safeSecretEquals(internalSecret, secret),
      )
    ) {
      throw new UnauthorizedException('Internal notification auth required');
    }

    this.chatGateway.pushNotification(body.userId, {
      type: body.type,
      // Emit as `message` to match GET /notifications + FE NotificationItem.
      // Accept either `content` (NotificationDispatcher) or `message` from callers.
      message: body.message ?? body.content ?? '',
      relatedId: body.relatedId,
      createdAt: new Date().toISOString(),
    });
    return { status: 'ok' };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getMyConversations(@CurrentUser('sub') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/search')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async searchMyConversations(
    @CurrentUser('sub') userId: string,
    @Query('q') q = '',
  ) {
    return this.chatService.searchConversations(userId, q);
  }

  /** Single conversation detail. Keep static route before `:userId`. */
  @Get('conversations/by-id/:conversationId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getConversationById(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') viewerId: string,
  ) {
    return this.chatService.getConversationById(conversationId, viewerId);
  }

  @Get('conversations/:userId/search')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async searchConversations(
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Query('q') q = '',
  ) {
    this.chatService.assertSameUser(userId, tokenUserId);
    return this.chatService.searchConversations(userId, q);
  }

  @Get('conversations/:userId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getConversations(
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string,
  ) {
    this.chatService.assertSameUser(userId, tokenUserId);
    return this.chatService.getConversations(userId);
  }

  @Get('unread/:userId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getUnread(
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string,
  ) {
    this.chatService.assertSameUser(userId, tokenUserId);
    return this.chatService.getUnreadCounts(userId);
  }

  @Get('messages/:conversationId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') viewerId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(
      conversationId,
      viewerId,
      Number(limit) || 50,
      before,
    );
  }

  @Post('messages/:conversationId/read')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async markRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.markConversationRead(conversationId, userId);
  }

  @Delete('messages/:messageId/for-me')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async deleteMessageForMe(
    @Param('messageId') messageId: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.chatService.deleteMessageForMe(messageId, userId);
    return { status: 'ok' };
  }

  @Post('conversations/:conversationId/state')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateConversationState(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Body()
    body: { isArchived?: boolean; isMuted?: boolean; isPinned?: boolean } = {},
  ) {
    return this.chatService.setConversationState(conversationId, userId, body);
  }

  @Post('conversations/:conversationId/pins/:messageId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async pinMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.pinMessage(conversationId, messageId, userId);
  }

  @Get('conversations/:conversationId/pins')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getPinnedMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.getPinnedMessages(conversationId, userId);
  }

  @Delete('conversations/:conversationId/pins/:messageId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async unpinMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.unpinMessage(conversationId, messageId, userId);
  }

  @Post('conversations/direct')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getOrCreateDirectConversation(
    @CurrentUser('sub') userId: string,
    @Body() body: { user1Id?: string; user2Id?: string } = {},
  ) {
    const otherId = body.user1Id === userId ? body.user2Id : body.user1Id;
    return this.chatService.getOrCreateDirectConversation(
      userId,
      otherId ?? '',
    );
  }

  /** Create/get a conversation from FE `{ type, participantIds }`. */
  @Post('conversations/from-participants')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async createConversationFromParticipants(
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    body: {
      creatorId?: string;
      type?: 'DIRECT' | 'GROUP';
      participantIds: string[];
      name?: string;
      avatar?: string;
    } = { participantIds: [] },
  ) {
    return this.chatService.createConversationFromParticipants(
      tokenUserId,
      body.type ?? 'DIRECT',
      body.participantIds ?? [],
      body.name,
      body.avatar,
    );
  }

  /** REST fallback for sending a message (socket path preferred). */
  @Post('messages/:conversationId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    body: {
      senderId?: string;
      content: string;
      type?: string;
      mediaUrl?: string;
      replyToId?: string;
    } = { content: '' },
  ) {
    return this.chatService.saveMessage(
      conversationId,
      tokenUserId,
      body.content,
      (body.type || 'text').toLowerCase(),
      body.mediaUrl,
      body.replyToId,
    );
  }

  /** Call history — placeholder until calling is persisted. */
  @Get('calls/history')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getCallHistory(@CurrentUser('sub') userId: string) {
    const items = await this.chatService.getCallHistory(userId);
    return { items };
  }

  /** LiveKit SFU room token for group/direct calls. */
  @Post('calls/livekit/token')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async createLiveKitToken(
    @CurrentUser('sub') userId: string,
    @Body()
    body: { conversationId: string; displayName?: string } = {
      conversationId: '',
    },
  ) {
    await this.chatService.getConversationById(body.conversationId, userId);
    const roomName = `conversation-${body.conversationId}`;
    return this.liveKitService.createRoomToken({
      roomName,
      identity: userId,
      name: body.displayName || userId,
      metadata: JSON.stringify({ conversationId: body.conversationId }),
    });
  }

  @Post('groups')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async createGroup(
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    body: {
      creatorId?: string;
      name: string;
      memberIds: string[];
      avatar?: string;
    } = { name: '', memberIds: [] },
  ) {
    return this.chatService.createGroup(
      tokenUserId,
      body.name,
      body.memberIds ?? [],
      body.avatar,
    );
  }

  @Post('groups/:conversationId/members')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async addMember(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() body: { actorId?: string; userId?: string } = {},
  ) {
    return this.chatService.addGroupMember(
      conversationId,
      tokenUserId,
      body.userId ?? '',
    );
  }

  @Delete('groups/:conversationId/members/:userId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async removeMember(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string,
  ) {
    const result = await this.chatService.removeGroupMember(
      conversationId,
      tokenUserId,
      userId,
    );
    await this.chatGateway.revokeConversationRoom(userId, conversationId);
    return result;
  }

  @Post('conversations/:conversationId/background')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateBackground(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { backgroundUrl?: string } = {},
  ) {
    return this.chatService.updateBackground(
      conversationId,
      userId,
      body.backgroundUrl ?? '',
    );
  }
}

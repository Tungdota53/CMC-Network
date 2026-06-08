import { Controller, Get, Param, Post, Body, Query, Delete } from '@nestjs/common';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /** Internal hook: other services push realtime notifications through here. */
  @Post('internal/notify')
  async internalNotify(
    @Body() body: { userId: string; type: string; content?: string; message?: string; relatedId?: string },
  ) {
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

  @Get('conversations/:userId')
  async getConversations(@Param('userId') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:userId/search')
  async searchConversations(@Param('userId') userId: string, @Query('q') q = '') {
    return this.chatService.searchConversations(userId, q);
  }

  @Get('unread/:userId')
  async getUnread(@Param('userId') userId: string) {
    return this.chatService.getUnreadCounts(userId);
  }

  @Get('messages/:conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') viewerId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(conversationId, viewerId, Number(limit) || 50, before);
  }

  @Post('messages/:conversationId/read')
  async markRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() body: { userId?: string },
  ) {
    return this.chatService.markConversationRead(conversationId, resolveUserId(tokenUserId, body.userId));
  }

  @Post('conversations/direct')
  async getOrCreateDirectConversation(@Body() body: { user1Id: string; user2Id: string }) {
    return this.chatService.getOrCreateDirectConversation(body.user1Id, body.user2Id);
  }

  @Post('groups')
  async createGroup(
    @CurrentUser('sub') tokenUserId: string,
    @Body() body: { creatorId?: string; name: string; memberIds: string[]; avatar?: string },
  ) {
    return this.chatService.createGroup(
      resolveUserId(tokenUserId, body.creatorId),
      body.name,
      body.memberIds ?? [],
      body.avatar,
    );
  }

  @Post('groups/:conversationId/members')
  async addMember(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() body: { actorId?: string; userId: string },
  ) {
    return this.chatService.addGroupMember(conversationId, resolveUserId(tokenUserId, body.actorId), body.userId);
  }

  @Delete('groups/:conversationId/members/:userId')
  async removeMember(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.chatService.removeGroupMember(conversationId, resolveUserId(tokenUserId, actorId), userId);
  }
}

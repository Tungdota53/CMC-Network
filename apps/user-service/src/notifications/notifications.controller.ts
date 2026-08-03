import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
  resolveUserId,
} from '@campus-connect/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private currentUserId(tokenUserId: string, requestedUserId?: string) {
    const currentUserId = resolveUserId(tokenUserId);
    if (requestedUserId && requestedUserId !== currentUserId) {
      throw new ForbiddenException('Không có quyền truy cập thông báo của người dùng khác');
    }
    return currentUserId;
  }

  // Contract: GET /notifications returns notification rows for JWT subject only.
  @Get()
  async listForCurrent(
    @CurrentUser('sub') tokenUserId: string,
    @Query('limit') limit?: string,
  ) {
    const rows = await this.notificationsService.list(
      resolveUserId(tokenUserId),
      limit ? Number(limit) : 30,
    );
    return {
      success: true,
      data: rows.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.content,
        relatedId: n.relatedId,
        isRead: n.isRead,
        createdAt: n.createdAt,
        sender: n.sender,
      })),
    };
  }

  @Get('preferences/me')
  async getPreferences(@CurrentUser('sub') tokenUserId: string) {
    return {
      success: true,
      data: await this.notificationsService.getPreferences(
        resolveUserId(tokenUserId),
      ),
    };
  }

  @Post('preferences/me')
  async updatePreferences(
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    body: Partial<{
      likes: boolean;
      comments: boolean;
      mentions: boolean;
      friendRequests: boolean;
      system: boolean;
      push: boolean;
      email: boolean;
      quietHours: boolean;
    }> = {},
  ) {
    return {
      success: true,
      data: await this.notificationsService.updatePreferences(
        resolveUserId(tokenUserId),
        body,
      ),
    };
  }

  @Post('read-all')
  async markAllReadForCurrent(@CurrentUser('sub') tokenUserId: string) {
    return this.notificationsService.markAllRead(resolveUserId(tokenUserId));
  }

  @Post(':notificationId/read')
  async markReadForCurrent(
    @CurrentUser('sub') tokenUserId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markRead(
      resolveUserId(tokenUserId),
      notificationId,
    );
  }

  @Get(':userId')
  async list(
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Query('limit') limit?: string,
  ) {
    const currentUserId = this.currentUserId(tokenUserId, userId);
    const rows = await this.notificationsService.list(
      currentUserId,
      limit ? Number(limit) : 30,
    );
    return {
      success: true,
      data: rows.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.content,
        relatedId: n.relatedId,
        isRead: n.isRead,
        createdAt: n.createdAt,
        sender: n.sender,
      })),
    };
  }

  @Get(':userId/unread-count')
  async unreadCount(
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string,
  ) {
    return this.notificationsService.unreadCount(
      this.currentUserId(tokenUserId, userId),
    );
  }

  @Post(':userId/read-all')
  async markAllRead(
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string,
  ) {
    return this.notificationsService.markAllRead(
      this.currentUserId(tokenUserId, userId),
    );
  }

  @Post(':userId/:notificationId/read')
  async markRead(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
    @CurrentUser('sub') tokenUserId: string,
  ) {
    return this.notificationsService.markRead(
      this.currentUserId(tokenUserId, userId),
      notificationId,
    );
  }

  /** Internal: create a persisted notification (called by other services). */
  @Post()
  async create(
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    body: {
      userId?: string;
      type: string;
      content: string;
      relatedId?: string;
      senderId?: string;
    } = { type: '', content: '' },
  ) {
    return this.notificationsService.create(
      resolveUserId(tokenUserId, body.userId),
      body.type as never,
      body.content,
      body.relatedId,
      body.senderId,
    );
  }
}

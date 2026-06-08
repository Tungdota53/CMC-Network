import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Contract (rules/API_CONTRACT.md):
   *   GET /notifications -> { success, data: [{ id, type, message, createdAt }] }
   * Identity from JWT; falls back to ?userId= during the compat window.
   */
  @Get()
  async listForCurrent(
    @CurrentUser('sub') tokenUserId: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    const rows = await this.notificationsService.list(
      resolveUserId(tokenUserId, userId),
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
      })),
    };
  }

  @Get(':userId')
  async list(@Param('userId') userId: string, @Query('limit') limit?: string) {
    const rows = await this.notificationsService.list(userId, limit ? Number(limit) : 30);
    return {
      success: true,
      data: rows.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.content,
        relatedId: n.relatedId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };
  }

  @Get(':userId/unread-count')
  async unreadCount(@Param('userId') userId: string) {
    return this.notificationsService.unreadCount(userId);
  }

  @Post(':userId/read-all')
  async markAllRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Post(':userId/:notificationId/read')
  async markRead(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markRead(userId, notificationId);
  }

  /** Internal: create a persisted notification (called by other services). */
  @Post()
  async create(
    @CurrentUser('sub') tokenUserId: string,
    @Body() body: { userId?: string; type: string; content: string; relatedId?: string },
  ) {
    return this.notificationsService.create(
      resolveUserId(tokenUserId, body.userId),
      body.type as never,
      body.content,
      body.relatedId,
    );
  }
}

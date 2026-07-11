import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

type NotifType =
  | 'LIKE'
  | 'COMMENT'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'SYSTEM'
  | 'MENTION';

@Injectable()
export class NotificationsService {
  /** Persist a notification row. Realtime push is handled by the dispatcher. */
  async create(
    userId: string,
    type: NotifType,
    content: string,
    relatedId?: string,
  ) {
    return prisma.notification.create({
      data: { userId, type: type as never, content, relatedId },
    });
  }

  async list(userId: string, limit = 30) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  async unreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new NotFoundException('Không tìm thấy thông báo');
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }
}

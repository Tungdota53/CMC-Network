import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

type NotifType =
  | 'LIKE'
  | 'COMMENT'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'SYSTEM'
  | 'MENTION';

type NotificationPreferencesInput = Partial<{
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  friendRequests: boolean;
  system: boolean;
  push: boolean;
  email: boolean;
  quietHours: boolean;
}>;

@Injectable()
export class NotificationsService {
  /** Persist a notification row. Realtime push is handled by the dispatcher. */
  async create(
    userId: string,
    type: NotifType,
    content: string,
    relatedId?: string,
  ) {
    const preferences = await this.getPreferences(userId);
    if (!this.isTypeEnabled(type, preferences)) {
      return { skipped: true, reason: 'disabled_by_preferences' };
    }
    return prisma.notification.create({
      data: { userId, type: type as never, content, relatedId },
    });
  }

  async getPreferences(userId: string) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updatePreferences(userId: string, data: NotificationPreferencesInput) {
    const allowed: NotificationPreferencesInput = {};
    for (const key of ['likes', 'comments', 'mentions', 'friendRequests', 'system', 'push', 'email', 'quietHours'] as const) {
      if (typeof data[key] === 'boolean') allowed[key] = data[key];
    }
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: allowed,
      create: { userId, ...allowed },
    });
  }

  private isTypeEnabled(type: NotifType, preferences: Awaited<ReturnType<NotificationsService['getPreferences']>>) {
    if (preferences.quietHours && type !== 'SYSTEM') return false;
    if (type === 'LIKE') return preferences.likes;
    if (type === 'COMMENT') return preferences.comments;
    if (type === 'MENTION') return preferences.mentions;
    if (type === 'FRIEND_REQUEST' || type === 'FRIEND_ACCEPT') return preferences.friendRequests;
    if (type === 'SYSTEM') return preferences.system;
    return true;
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

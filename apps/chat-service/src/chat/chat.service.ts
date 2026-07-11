import { ForbiddenException, Injectable } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import {
  createStorageProvider,
  validateUpload,
  type StorageProvider,
} from '@campus-connect/common';
import { join } from 'path';

type UploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class ChatService {
  private readonly storage: StorageProvider = createStorageProvider(
    join(process.cwd(), 'uploads'),
    '/uploads',
  );

  async uploadFile(file: UploadFile) {
    validateUpload(
      {
        mimetype: file.mimetype,
        size: file.size ?? file.buffer.length,
        originalname: file.originalname,
      },
      { preset: 'any', maxSizeBytes: 50 * 1024 * 1024 },
    );

    const stored = await this.storage.put({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size ?? file.buffer.length,
      folder: 'chat',
    });

    return { url: stored.url };
  }
  async getOrCreateDirectConversation(user1Id: string, user2Id: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        type: 'DIRECT',
        members: {
          some: { userId: user1Id },
        },
      },
      include: { members: true },
    });

    const existing = conversations.find((conversation) => {
      const memberIds = conversation.members.map((member) => member.userId);
      return (
        memberIds.length === 2 &&
        memberIds.includes(user1Id) &&
        memberIds.includes(user2Id)
      );
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [{ userId: user1Id }, { userId: user2Id }],
        },
      },
      include: { members: true },
    });
  }

  /** Create a group conversation. The creator is the owner. */
  async createGroup(
    creatorId: string,
    name: string,
    memberIds: string[],
    avatar?: string,
  ) {
    const uniqueIds = Array.from(new Set([creatorId, ...memberIds]));
    return prisma.conversation.create({
      data: {
        type: 'GROUP',
        name,
        avatar,
        members: {
          create: uniqueIds.map((userId) => ({
            userId,
            role: userId === creatorId ? 'owner' : 'member',
          })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async addGroupMember(
    conversationId: string,
    actorId: string,
    userId: string,
  ) {
    await this.assertGroupOwner(conversationId, actorId);
    return prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId, role: 'member' },
      update: {},
    });
  }

  async removeGroupMember(
    conversationId: string,
    actorId: string,
    userId: string,
  ) {
    await this.assertGroupOwner(conversationId, actorId);
    return prisma.conversationMember.delete({
      where: { conversationId_userId: { conversationId, userId } },
    });
  }

  private async assertGroupOwner(conversationId: string, userId: string) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member || member.role !== 'owner') {
      throw new ForbiddenException('Chỉ chủ nhóm mới có quyền này');
    }
  }

  /** Persist a message; allowed types: text, image, file, video, audio. */
  async saveMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = 'text',
    mediaUrl?: string,
    replyToId?: string,
  ) {
    const allowedTypes = ['text', 'image', 'file', 'video', 'audio'];
    if (!allowedTypes.includes(messageType)) {
      messageType = 'text';
    }

    // Ensure sender belongs to the conversation.
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!member) {
      throw new ForbiddenException('Bạn không thuộc đoạn chat này');
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        messageType,
        mediaUrl,
        status: 'SENT',
        replyToId,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        reactions: true,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async recallMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.senderId !== userId) return null;

    return prisma.message.update({
      where: { id: messageId },
      data: { content: 'Tin nhắn đã bị thu hồi', messageType: 'recalled' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        reactions: true,
      },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    return prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    try {
      await prisma.messageReaction.delete({
        where: { messageId_userId_emoji: { messageId, userId, emoji } },
      });
    } catch {
      // Ignore if not exists
    }
  }

  /** Mark one message as DELIVERED (called when the recipient socket receives it). */
  async markDelivered(messageId: string) {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!existing || existing.status === 'READ') return existing;
    return prisma.message.update({
      where: { id: messageId },
      data: { status: 'DELIVERED' },
    });
  }

  /** Mark all messages in a conversation as READ for a given viewer, returns affected count. */
  async markConversationRead(conversationId: string, viewerId: string) {
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: viewerId },
        status: { not: 'READ' },
      },
      data: { status: 'READ' },
    });
    return { updated: result.count };
  }

  /** Unread message count per conversation for a viewer. */
  async getUnreadCounts(viewerId: string) {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: viewerId },
      select: { conversationId: true },
    });
    const ids = memberships.map((m) => m.conversationId);
    if (ids.length === 0)
      return {
        total: 0,
        perConversation: [] as { conversationId: string; count: number }[],
      };

    const grouped = await prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: ids },
        senderId: { not: viewerId },
        status: { not: 'READ' },
      },
      _count: { _all: true },
    });

    const perConversation = grouped.map((g) => ({
      conversationId: g.conversationId,
      count: g._count._all,
    }));
    const total = perConversation.reduce((acc, c) => acc + c.count, 0);
    return { total, perConversation };
  }

  async getConversations(userId: string) {
    const members = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: { select: { id: true, fullName: true, avatarUrl: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: { updatedAt: 'desc' },
      },
    });

    const unread = await this.getUnreadCounts(userId);
    const unreadMap = new Map(
      unread.perConversation.map((u) => [u.conversationId, u.count]),
    );

    return members.map((member) => {
      const conversation = member.conversation;
      const otherMembers = conversation.members.filter(
        (m) => m.userId !== userId,
      );
      const title =
        conversation.type === 'DIRECT'
          ? otherMembers[0]?.user.fullName
          : conversation.name;
      const avatarUrl =
        conversation.type === 'DIRECT'
          ? otherMembers[0]?.user.avatarUrl
          : conversation.avatar;

      return {
        ...conversation,
        title: title ?? 'Đoạn chat',
        avatarUrl,
        otherMembers,
        lastMessage: conversation.messages[0] ?? null,
        unreadCount: unreadMap.get(conversation.id) ?? 0,
      };
    });
  }

  /** Search conversations of a user by other-member name or group name. */
  async searchConversations(userId: string, query: string) {
    const keyword = query.trim();
    if (keyword.length < 2) return [];

    const conversations = await prisma.conversation.findMany({
      where: {
        members: { some: { userId } },
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          {
            type: 'DIRECT',
            members: {
              some: {
                userId: { not: userId },
                user: { fullName: { contains: keyword, mode: 'insensitive' } },
              },
            },
          },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const unread = await this.getUnreadCounts(userId);
    const unreadMap = new Map(
      unread.perConversation.map((u) => [u.conversationId, u.count]),
    );

    return conversations.map((conversation) => {
      const otherMembers = conversation.members.filter(
        (m) => m.userId !== userId,
      );
      const title =
        conversation.type === 'DIRECT'
          ? otherMembers[0]?.user.fullName
          : conversation.name;
      const avatarUrl =
        conversation.type === 'DIRECT'
          ? otherMembers[0]?.user.avatarUrl
          : conversation.avatar;

      return {
        ...conversation,
        title: title ?? 'Đoạn chat',
        avatarUrl,
        otherMembers,
        lastMessage: conversation.messages[0] ?? null,
        unreadCount: unreadMap.get(conversation.id) ?? 0,
      };
    });
  }

  async getMessages(
    conversationId: string,
    viewerId?: string,
    limit = 50,
    before?: string,
  ) {
    if (viewerId) {
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId: viewerId } },
      });
      if (!member)
        throw new ForbiddenException('Bạn không thuộc đoạn chat này');
    }

    return prisma.message.findMany({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        reactions: true,
      },
    });
  }

  async updateBackground(conversationId: string, backgroundUrl: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { backgroundUrl },
    });
  }
}

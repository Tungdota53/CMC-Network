import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import {
  createStorageProvider,
  validateUpload,
  type StorageProvider,
} from '@campus-connect/common';
import { resolve } from 'path';

type UploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class ChatService {
  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private readonly storage: StorageProvider = createStorageProvider(
    resolve(process.env.UPLOAD_ROOT || resolve(process.cwd(), '..', '..', '.data', 'uploads')),
    process.env.UPLOAD_PUBLIC_BASE_URL || '/uploads',
  );

  private async assertConversationMember(
    conversationId: string,
    userId: string,
  ) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Bạn không thuộc đoạn chat này');
    return member;
  }

  private async assertMessageConversationMember(
    messageId: string,
    userId: string,
  ) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: { members: { some: { userId } } },
      },
      select: { id: true, conversationId: true, senderId: true, status: true },
    });
    if (!message) throw new ForbiddenException('Bạn không thuộc đoạn chat này');
    return message;
  }

  assertSameUser(requestedUserId: string, tokenUserId: string) {
    if (requestedUserId !== tokenUserId) {
      throw new ForbiddenException('Không có quyền truy cập tài nguyên này');
    }
  }

  async assertConversationMemberAccess(conversationId: string, userId: string) {
    return this.assertConversationMember(conversationId, userId);
  }

  async getMessageForMember(messageId: string, userId: string) {
    return this.assertMessageConversationMember(messageId, userId);
  }

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
    if (!user1Id || !user2Id || user1Id === user2Id) {
      throw new ForbiddenException('Thiếu người nhận cho cuộc trò chuyện');
    }

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

  /**
   * Create-or-get a conversation from the FE payload
   * `{ type, participantIds }`. DIRECT reuses the existing 1:1 thread.
   * Matches FE `POST /conversations`.
   */
  async createConversationFromParticipants(
    creatorId: string,
    type: 'DIRECT' | 'GROUP',
    participantIds: string[],
    name?: string,
    avatar?: string,
  ) {
    const others = (participantIds || []).filter((id) => id !== creatorId);
    if (type === 'DIRECT') {
      const otherId = others[0];
      if (!otherId) {
        throw new ForbiddenException('Thiếu người nhận cho cuộc trò chuyện');
      }
      return this.getConversationById(
        (await this.getOrCreateDirectConversation(creatorId, otherId)).id,
        creatorId,
      );
    }
    const group = await this.createGroup(
      creatorId,
      name ?? 'Nhóm mới',
      others,
      avatar,
    );
    return this.getConversationById(group.id, creatorId);
  }

  /** Full detail for a single conversation (viewer must be a member). */
  async getConversationById(conversationId: string, viewerId: string) {
    if (!this.isUuid(conversationId)) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }
    const isMember = conversation.members.some((m) => m.userId === viewerId);
    if (!isMember) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }
    return conversation;
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
    const allowedTypes = [
      'text',
      'image',
      'file',
      'video',
      'audio',
      'call_audio',
      'call_video',
      'system',
    ];
    if (!allowedTypes.includes(messageType)) {
      messageType = 'text';
    }

    // Ensure sender belongs to the conversation.
    await this.assertConversationMember(conversationId, senderId);

    if (replyToId) {
      const replyTarget = await prisma.message.findFirst({
        where: { id: replyToId, conversationId },
        select: { id: true },
      });
      if (!replyTarget) {
        throw new NotFoundException(
          'Tin nhắn trả lời không thuộc đoạn chat này',
        );
      }
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
    const scopedMessage = await this.assertMessageConversationMember(
      messageId,
      userId,
    );
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.senderId !== userId) return null;

    return prisma.message
      .update({
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
      })
      .then((updated) => ({
        ...updated,
        conversationId: scopedMessage.conversationId,
      }));
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const scopedMessage = await this.assertMessageConversationMember(
      messageId,
      userId,
    );
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.senderId !== userId) return null;
    if (message.messageType === 'recalled') return null;

    return prisma.message
      .update({
        where: { id: messageId },
        data: { content },
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
      })
      .then((updated) => ({
        ...updated,
        conversationId: scopedMessage.conversationId,
      }));
  }

  async forwardMessage(
    messageId: string,
    senderId: string,
    conversationId: string,
  ) {
    await this.assertMessageConversationMember(messageId, senderId);
    const source = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!source || source.messageType === 'recalled') return null;

    return this.saveMessage(
      conversationId,
      senderId,
      source.content,
      source.messageType,
      source.mediaUrl ?? undefined,
    );
  }

  async createCallMessage(
    conversationId: string | undefined,
    callerId: string,
    isVideo: boolean,
  ) {
    if (!conversationId) return null;
    return this.saveMessage(
      conversationId,
      callerId,
      isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại',
      isVideo ? 'call_video' : 'call_audio',
    );
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    await this.assertMessageConversationMember(messageId, userId);
    return prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    });
  }

  async removeReaction(messageId: string, userId: string, emoji?: string) {
    await this.assertMessageConversationMember(messageId, userId);
    try {
      if (!emoji) {
        await prisma.messageReaction.deleteMany({
          where: { messageId, userId },
        });
        return;
      }

      await prisma.messageReaction.delete({
        where: { messageId_userId_emoji: { messageId, userId, emoji } },
      });
    } catch {
      // Ignore if not exists
    }
  }

  /** Mark one message as DELIVERED (called when the recipient socket receives it). */
  async markDelivered(messageId: string, userId: string) {
    const existing = await this.assertMessageConversationMember(
      messageId,
      userId,
    );
    if (!existing || existing.status === 'READ') return existing;
    if (existing.senderId === userId) return existing;
    return prisma.message.update({
      where: { id: messageId },
      data: { status: 'DELIVERED' },
    });
  }

  /** Mark all messages in a conversation as READ for a given viewer, returns affected count. */
  async markConversationRead(conversationId: string, viewerId: string) {
    await this.assertConversationMember(conversationId, viewerId);

    await prisma.conversationUserState.upsert({
      where: { conversationId_userId: { conversationId, userId: viewerId } },
      update: { lastReadAt: new Date() },
      create: { conversationId, userId: viewerId, lastReadAt: new Date() },
    });

    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: viewerId },
        status: { not: 'READ' },
      },
      select: { id: true },
    });

    await prisma.messageReadReceipt.createMany({
      data: unreadMessages.map((message) => ({
        messageId: message.id,
        userId: viewerId,
      })),
      skipDuplicates: true,
    });

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

  async deleteMessageForMe(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });
    if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: message.conversationId,
          userId,
        },
      },
    });
    if (!member) throw new ForbiddenException('Bạn không thuộc đoạn chat này');

    return prisma.messageDeletion.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { deletedAt: new Date() },
      create: { messageId, userId },
    });
  }

  async setConversationState(
    conversationId: string,
    userId: string,
    data: { isArchived?: boolean; isMuted?: boolean; isPinned?: boolean },
  ) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Bạn không thuộc đoạn chat này');

    return prisma.conversationUserState.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: data,
      create: { conversationId, userId, ...data },
    });
  }

  async pinMessage(conversationId: string, messageId: string, userId: string) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Bạn không thuộc đoạn chat này');

    const message = await prisma.message.findFirst({
      where: { id: messageId, conversationId },
    });
    if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');

    return prisma.pinnedMessage.upsert({
      where: { conversationId_messageId: { conversationId, messageId } },
      update: { userId },
      create: { conversationId, messageId, userId },
    });
  }

  async getPinnedMessages(conversationId: string, userId: string) {
    await this.assertConversationMember(conversationId, userId);
    return prisma.pinnedMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: {
            sender: { select: { id: true, fullName: true, avatarUrl: true } },
            reactions: true,
          },
        },
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async unpinMessage(
    conversationId: string,
    messageId: string,
    userId: string,
  ) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Bạn không thuộc đoạn chat này');

    await prisma.pinnedMessage.deleteMany({
      where: { conversationId, messageId },
    });
    return { status: 'ok' };
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
            userStates: { where: { userId } },
            pinnedMessages: { include: { message: true } },
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
      const userState = conversation.userStates[0] ?? null;
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
        userState,
        pinnedMessages: conversation.pinnedMessages,
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
        userStates: { where: { userId } },
        pinnedMessages: { include: { message: true } },
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
      const userState = conversation.userStates[0] ?? null;
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
        userState,
        pinnedMessages: conversation.pinnedMessages,
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
    if (!this.isUuid(conversationId)) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

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
        ...(viewerId ? { deletions: { none: { userId: viewerId } } } : {}),
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
        readReceipts: true,
      },
    });
  }

  async startCallSession(
    conversationId: string,
    startedById: string,
    isVideo: boolean,
  ) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: startedById } },
    });
    if (!member) throw new ForbiddenException('Bạn không thuộc đoạn chat này');

    return prisma.callSession.create({
      data: {
        conversationId,
        startedById,
        callType: isVideo ? 'video' : 'audio',
        status: 'started',
      },
    });
  }

  async getCallHistory(userId: string) {
    return prisma.message.findMany({
      where: {
        messageType: { in: ['call_audio', 'call_video'] },
        conversation: { members: { some: { userId } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: { select: { id: true, fullName: true, avatarUrl: true } },
              },
            },
          },
        },
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async updateBackground(
    conversationId: string,
    userId: string,
    backgroundUrl: string,
  ) {
    await this.assertConversationMember(conversationId, userId);

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { backgroundUrl },
    });
  }
}

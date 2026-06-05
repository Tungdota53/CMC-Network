import { Injectable } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

@Injectable()
export class ChatService {
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
      return memberIds.length === 2 && memberIds.includes(user1Id) && memberIds.includes(user2Id);
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

  async saveMessage(conversationId: string, senderId: string, content: string, messageType: string = 'text', mediaUrl?: string) {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        messageType,
        mediaUrl,
        status: 'SENT',
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async recallMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== userId) return null;

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: 'Tin nhắn đã bị thu hồi',
        messageType: 'recalled',
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return updatedMessage;
  }

  async getConversations(userId: string) {
    const members = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, fullName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: { updatedAt: 'desc' },
      },
    });

    return members.map((member) => {
      const conversation = member.conversation;
      const otherMembers = conversation.members.filter((conversationMember) => conversationMember.userId !== userId);
      const title = conversation.type === 'DIRECT'
        ? otherMembers[0]?.user.fullName
        : conversation.name;
      const avatarUrl = conversation.type === 'DIRECT'
        ? otherMembers[0]?.user.avatarUrl
        : conversation.avatar;

      return {
        ...conversation,
        title: title ?? 'Đoạn chat',
        avatarUrl,
        otherMembers,
        lastMessage: conversation.messages[0] ?? null,
      };
    });
  }

  async getMessages(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }
}

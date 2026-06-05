import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UsersService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'avatars');

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        studentId: true,
        department: true,
        major: true,
        cohort: true,
        bio: true,
        avatarUrl: true,
        location: true,
        reputationScore: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async updateProfile(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async uploadAvatar(userId: string, file: { buffer: Buffer; originalname: string }) {
    const ext = file.originalname.split('.').pop() || 'png';
    const safeFileName = `${userId}-${Date.now()}.${ext}`;
    const filePath = join(this.uploadDir, safeFileName);

    await fs.writeFile(filePath, file.buffer);

    const avatarUrl = `/avatars/${safeFileName}`;
    await this.updateProfile(userId, { avatarUrl });

    return { message: 'Upload ảnh đại diện thành công', avatarUrl };
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new Error('Không thể kết bạn với chính mình');

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) throw new NotFoundException('Không tìm thấy người nhận');

    const existingFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });

    if (existingFriend) throw new Error('Hai người đã là bạn bè');

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: 'pending',
      },
    });

    if (existingRequest) throw new Error('Đã có lời mời kết bạn đang chờ');

    return prisma.friendRequest.create({
      data: { senderId, receiverId, status: 'pending' },
      include: {
        receiver: { select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true } },
      },
    });
  }

  async respondFriendRequest(userId: string, requestId: string, status: 'accepted' | 'rejected') {
    const request = await prisma.friendRequest.findFirst({
      where: { id: requestId, receiverId: userId, status: 'pending' },
    });

    if (!request) throw new NotFoundException('Không tìm thấy lời mời kết bạn');

    if (status === 'accepted') {
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: request.senderId, userBId: request.receiverId },
            { userAId: request.receiverId, userBId: request.senderId },
          ],
        },
      });

      if (!existingFriendship) {
        await prisma.friendship.create({
          data: { userAId: request.senderId, userBId: request.receiverId },
        });
      }
    }

    return prisma.friendRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true } },
      },
    });
  }

  async cancelFriendRequest(userId: string, requestId: string) {
    const request = await prisma.friendRequest.findFirst({
      where: { id: requestId, senderId: userId, status: 'pending' },
    });

    if (!request) throw new NotFoundException('Không tìm thấy lời mời đã gửi');

    return prisma.friendRequest.delete({ where: { id: requestId } });
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });

    if (!friendship) throw new NotFoundException('Hai người chưa là bạn bè');

    return prisma.friendship.delete({ where: { id: friendship.id } });
  }

  async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, fullName: true, avatarUrl: true, isVerified: true, major: true, cohort: true } },
        userB: { select: { id: true, fullName: true, avatarUrl: true, isVerified: true, major: true, cohort: true } },
      },
    });

    return friendships.map((friendship) => friendship.userAId === userId ? friendship.userB : friendship.userA);
  }

  async getFriendRequests(userId: string) {
    return prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentFriendRequests(userId: string) {
    return prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'pending' },
      include: {
        receiver: { select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFriendSuggestions(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const friends = await this.getFriends(userId);
    const friendIds = friends.map((friend) => friend.id);

    const pendingRequests = await prisma.friendRequest.findMany({
      where: {
        status: 'pending',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const pendingUserIds = pendingRequests.map((request) => request.senderId === userId ? request.receiverId : request.senderId);
    const excludedIds = [userId, ...friendIds, ...pendingUserIds];
    const where = { id: { notIn: excludedIds } };
    const profileMatches: Array<{ major: string } | { cohort: string }> = [];
    if (user.major) profileMatches.push({ major: user.major });
    if (user.cohort) profileMatches.push({ cohort: user.cohort });

    if (profileMatches.length > 0) {
      const suggestions = await prisma.user.findMany({
        where: {
          ...where,
          OR: profileMatches,
        },
        take: 8,
        select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true },
      });

      if (suggestions.length > 0) return suggestions;
    }

    return prisma.user.findMany({
      where,
      take: 8,
      select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true },
    });
  }

  async searchUsers(userId: string, query: string) {
    const keyword = query.trim();
    if (keyword.length < 2) return [];

    const friends = await this.getFriends(userId);
    const friendIds = friends.map((friend) => friend.id);
    const pendingRequests = await prisma.friendRequest.findMany({
      where: {
        status: 'pending',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const pendingUserIds = pendingRequests.map((request) => request.senderId === userId ? request.receiverId : request.senderId);

    return prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...friendIds, ...pendingUserIds] },
        OR: [
          { fullName: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
          { studentId: { contains: keyword, mode: 'insensitive' } },
          { department: { contains: keyword, mode: 'insensitive' } },
          { major: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true },
    });
  }

  async getAllUsersAdmin() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isSuspended: true,
        createdAt: true,
      }
    });
  }

  async suspendUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    return prisma.user.update({
      where: { id: userId },
      data: { isSuspended: !user.isSuspended },
      select: { id: true, isSuspended: true, fullName: true },
    });
  }

  async changeUserRole(userId: string, role: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    return prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, role: true, fullName: true },
    });
  }
}

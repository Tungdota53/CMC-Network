import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import * as bcrypt from 'bcrypt';
import {
  NotificationDispatcher,
  validateUpload,
  createStorageProvider,
} from '@campus-connect/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UsersService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'avatars');
  private readonly storageProvider = createStorageProvider(
    join(process.cwd(), 'uploads'),
    '',
  );

  constructor(private readonly notifier: NotificationDispatcher) {
    this.ensureUploadDir();
  }

  /** Persist + push a realtime notification; never throws into the caller. */
  private async notify(
    userId: string,
    type: string,
    content: string,
    relatedId?: string,
  ) {
    try {
      await prisma.notification.create({
        data: { userId, type: type as never, content, relatedId },
      });
    } catch {
      // ignore persistence errors
    }
    try {
      await this.notifier.push({
        userId,
        type: type as never,
        content,
        relatedId,
      });
    } catch (err) {
      console.error('Lỗi khi push notification:', err);
    }
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }

  private buildProfileSlug(user: { id: string; studentId?: string | null; email?: string | null }) {
    const source = user.studentId || user.email?.split('@')[0] || user.id;
    return source
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || user.id;
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private async findUserByProfileIdentifier(identifier: string, select: any) {
    if (this.isUuid(identifier)) {
      return prisma.user.findUnique({ where: { id: identifier }, select });
    }

    return prisma.user.findFirst({
      where: {
        OR: [
          { studentId: { equals: identifier, mode: 'insensitive' } },
          { email: { startsWith: `${identifier}@`, mode: 'insensitive' } },
        ],
      },
      select,
    });
  }

  async getUserCount() {
    const count = await prisma.user.count({
      where: { isSuspended: false },
    });
    return { count };
  }

  async getProfile(userId: string) {
    const user = await this.findUserByProfileIdentifier(userId, {
      id: true,
      email: true,
      fullName: true,
      studentId: true,
      department: true,
      major: true,
      cohort: true,
      bio: true,
      avatarUrl: true,
      coverPhotoUrl: true,
      location: true,
      reputationScore: true,
      role: true,
      isVerified: true,
      hasBlueBadge: true,
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return { ...user, profileSlug: this.buildProfileSlug(user as any), status: 'ACTIVE' };
  }

  /** Full public profile: core fields + counts + badges + skills. */
  async getPublicProfile(userId: string) {
    const user = await this.findUserByProfileIdentifier(userId, {
      id: true,
      email: true,
      fullName: true,
      studentId: true,
      department: true,
      major: true,
      cohort: true,
      bio: true,
      avatarUrl: true,
      coverPhotoUrl: true,
      location: true,
      reputationScore: true,
      role: true,
      isVerified: true,
      hasBlueBadge: true,
      createdAt: true,
      badges: { select: { badge: true, earnedAt: true } },
      skills: true,
      _count: {
        select: { posts: true, friendships: true, friendships2: true },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const { _count, ...rest } = user as any;
    return {
      ...rest,
      profileSlug: this.buildProfileSlug(user as any),
      postCount: _count.posts,
      friendCount: _count.friendships + _count.friendships2,
    };
  }

  /** Posts authored by a user (newest first). */
  async getUserPosts(userId: string, limit = 20) {
    return prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        _count: { select: { comments: true } },
      },
    });
  }

  /** Image media a user has posted (for the Photos tab). */
  async getUserPhotos(userId: string) {
    const posts = await prisma.post.findMany({
      where: { userId, mediaUrls: { isEmpty: false } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, mediaUrls: true, createdAt: true },
      take: 50,
    });
    return posts.flatMap((p) =>
      p.mediaUrls.map((url) => ({ url, postId: p.id, createdAt: p.createdAt })),
    );
  }

  /** Update cover photo URL. */
  async updateCover(userId: string, coverPhotoUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { coverPhotoUrl },
      select: { id: true, coverPhotoUrl: true },
    });
  }

  /** Allowed fields for self-service profile updates (no role, isSuspended, etc.). */
  private static readonly PROFILE_WHITELIST = [
    'fullName',
    'bio',
    'location',
    'department',
    'avatarUrl',
    'coverPhotoUrl',
  ] as const;

  async updateEmail(userId: string, newEmail: string) {
    const normalized = newEmail?.trim().toLowerCase();
    const parts = normalized?.split('@') ?? [];
    const domain = parts.length === 2 ? parts[1] : '';
    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (
      !normalized ||
      parts.length !== 2 ||
      !parts[0] ||
      !domain ||
      !/^[a-z0-9.-]+$/.test(domain)
    ) {
      throw new BadRequestException('Email không hợp lệ');
    }
    if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
      throw new BadRequestException('Email không thuộc miền được phép');
    }
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email đã được sử dụng');
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalized,
        emailVerified: false,
        isVerified: false,
        otpCode: null,
        otpExpiry: null,
      },
    });
    return { email: normalized, emailVerified: false, isVerified: false };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user || !user.passwordHash) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    const salt = await bcrypt.genSalt();
    const newHash = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async updateProfile(userId: string, data: any) {
    const sanitized: Record<string, unknown> = {};
    for (const key of UsersService.PROFILE_WHITELIST) {
      if (data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    }
    return prisma.user.update({
      where: { id: userId },
      data: sanitized,
    });
  }

  async uploadAvatar(
    userId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype?: string;
      size?: number;
    },
  ) {
    validateUpload(
      {
        mimetype: file.mimetype,
        size: file.size ?? file.buffer.length,
        originalname: file.originalname,
      },
      { preset: 'image', maxSizeBytes: 20 * 1024 * 1024 },
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    const storedFile = await this.storageProvider.put({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype || 'image/png',
      size: file.size || file.buffer.length,
      folder: 'avatars',
    });

    const avatarUrl = storedFile.url;
    await this.updateProfile(userId, { avatarUrl });

    if (user?.avatarUrl) {
      const oldKey = user.avatarUrl.startsWith('/')
        ? user.avatarUrl.substring(1)
        : user.avatarUrl;
      await this.storageProvider.delete(oldKey);
    }

    return { message: 'Upload ảnh đại diện thành công', avatarUrl };
  }

  async uploadCover(
    userId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype?: string;
      size?: number;
    },
  ) {
    validateUpload(
      {
        mimetype: file.mimetype,
        size: file.size ?? file.buffer.length,
        originalname: file.originalname,
      },
      { preset: 'image', maxSizeBytes: 20 * 1024 * 1024 },
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coverPhotoUrl: true },
    });

    const storedFile = await this.storageProvider.put({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype || 'image/png',
      size: file.size || file.buffer.length,
      folder: 'covers',
    });

    const coverPhotoUrl = storedFile.url;
    await this.updateProfile(userId, { coverPhotoUrl });

    if (user?.coverPhotoUrl) {
      const oldKey = user.coverPhotoUrl.startsWith('/')
        ? user.coverPhotoUrl.substring(1)
        : user.coverPhotoUrl;
      await this.storageProvider.delete(oldKey);
    }

    return { message: 'Upload ảnh bìa thành công', coverPhotoUrl };
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId)
      throw new BadRequestException('Không thể kết bạn với chính mình');

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver) throw new NotFoundException('Không tìm thấy người nhận');

    const existingFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });

    if (existingFriend) throw new ConflictException('Hai người đã là bạn bè');

    const existingRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    for (const req of existingRequests) {
      if (req.status === 'pending') {
        throw new ConflictException('Đã có lời mời kết bạn đang chờ');
      }
      await prisma.friendRequest.delete({ where: { id: req.id } });
    }

    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId, status: 'pending' },
      include: {
        receiver: true,
        sender: true,
      },
    });

    await this.notify(
      receiverId,
      'FRIEND_REQUEST',
      `${request.sender.fullName} đã gửi lời mời kết bạn`,
      senderId,
    );

    return request;
  }

  async respondFriendRequest(
    userId: string,
    requestId: string,
    status: 'accepted' | 'rejected',
  ) {
    const request = await prisma.friendRequest.findFirst({
      where: { id: requestId, receiverId: userId, status: 'pending' },
    });

    if (!request) throw new NotFoundException('Không tìm thấy lời mời kết bạn');

    let updatedRequest;
    if (status === 'accepted') {
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: request.senderId, userBId: request.receiverId },
            { userAId: request.receiverId, userBId: request.senderId },
          ],
        },
      });

      const operations = [];
      if (!existingFriendship) {
        operations.push(
          prisma.friendship.create({
            data: { userAId: request.senderId, userBId: request.receiverId },
          }),
        );
      }

      operations.push(
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status },
          include: { sender: true },
        }),
      );

      const result = await prisma.$transaction(operations);
      updatedRequest = result[result.length - 1];

      const accepter = await prisma.user.findUnique({
        where: { id: request.receiverId },
        select: { fullName: true },
      });

      await this.notify(
        request.senderId,
        'FRIEND_ACCEPT',
        `${accepter?.fullName ?? 'Ai đó'} đã chấp nhận lời mời kết bạn`,
        request.receiverId,
      );
    } else {
      updatedRequest = await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status },
        include: { sender: true },
      });
    }

    return updatedRequest;
  }

  async cancelFriendRequest(userId: string, requestId: string) {
    const request = await prisma.friendRequest.findFirst({
      where: { id: requestId, senderId: userId, status: 'pending' },
    });

    if (!request) throw new NotFoundException('Không tìm thấy lời mời đã gửi');

    return prisma.friendRequest.delete({ where: { id: requestId } });
  }

  /** Cancel an outgoing friend request by receiver (target) id. */
  async cancelFriendRequestByTarget(userId: string, targetId: string) {
    const request = await prisma.friendRequest.findFirst({
      where: { senderId: userId, receiverId: targetId, status: 'pending' },
    });
    if (!request) throw new NotFoundException('Không tìm thấy lời mời đã gửi');
    return prisma.friendRequest.delete({ where: { id: request.id } });
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

  /**
   * Accept a pending friend request identified by the *sender* (target) id,
   * not the request id. Matches FE `POST /friends/accept/:targetId`.
   */
  async acceptFriendRequestByTarget(userId: string, targetId: string) {
    const request = await prisma.friendRequest.findFirst({
      where: { senderId: targetId, receiverId: userId, status: 'pending' },
    });
    if (!request) throw new NotFoundException('Không tìm thấy lời mời kết bạn');
    return this.respondFriendRequest(userId, request.id, 'accepted');
  }

  /** Reject a pending friend request by sender (target) id. */
  async rejectFriendRequestByTarget(userId: string, targetId: string) {
    const request = await prisma.friendRequest.findFirst({
      where: { senderId: targetId, receiverId: userId, status: 'pending' },
    });
    if (!request) throw new NotFoundException('Không tìm thấy lời mời kết bạn');
    return this.respondFriendRequest(userId, request.id, 'rejected');
  }

  /** Block a user: remove any friendship/requests, then persist the block. */
  async blockUser(userId: string, targetId: string) {
    if (userId === targetId)
      throw new BadRequestException('Không thể chặn chính mình');

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('Không tìm thấy người dùng');

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userAId: userId, userBId: targetId },
          { userAId: targetId, userBId: userId },
        ],
      },
    });
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId },
        ],
      },
    });

    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: targetId },
      },
      create: { blockerId: userId, blockedId: targetId },
      update: {},
    });
    return { blocked: true };
  }

  /** Unblock a previously blocked user (no-op if not blocked). */
  async unblockUser(userId: string, targetId: string) {
    await prisma.userBlock.deleteMany({
      where: { blockerId: userId, blockedId: targetId },
    });
    return { blocked: false };
  }

  /** Users the given user has blocked. */
  async getBlockedUsers(userId: string) {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        blocked: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
            hasBlueBadge: true,
            major: true,
            cohort: true,
          },
        },
      },
    });
    return blocks.map((b) => b.blocked);
  }

  /** Friends shared between the current user and a target user. */
  async getMutualFriends(userId: string, targetId: string) {
    const [myFriends, theirFriends] = await Promise.all([
      this.getFriends(userId),
      this.getFriends(targetId),
    ]);
    const theirIds = new Set(theirFriends.map((f) => f.id));
    return myFriends.filter((f) => theirIds.has(f.id));
  }

  async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
            hasBlueBadge: true,
            major: true,
            cohort: true,
          },
        },
        userB: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
            hasBlueBadge: true,
            major: true,
            cohort: true,
          },
        },
      },
    });

    return friendships.map((friendship) =>
      friendship.userAId === userId ? friendship.userB : friendship.userA,
    );
  }

  async getFriendRequests(userId: string) {
    return prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: {
        sender: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentFriendRequests(userId: string) {
    return prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'pending' },
      include: {
        receiver: true,
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
    const pendingUserIds = pendingRequests.map((request) =>
      request.senderId === userId ? request.receiverId : request.senderId,
    );
    const excludedIds = [userId, ...friendIds, ...pendingUserIds];
    const where = {
      id: { notIn: excludedIds },
      emailVerified: true,
      isVerified: true,
      isSuspended: false,
    };
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
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          major: true,
          cohort: true,
        },
      });

      if (suggestions.length > 0) return suggestions;
    }

    return prisma.user.findMany({
      where,
      take: 8,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        major: true,
        cohort: true,
      },
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
    const pendingUserIds = pendingRequests.map((request) =>
      request.senderId === userId ? request.receiverId : request.senderId,
    );

    return prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...friendIds, ...pendingUserIds] },
        emailVerified: true,
        isSuspended: false,
        OR: [
          { fullName: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
          { studentId: { contains: keyword, mode: 'insensitive' } },
          { department: { contains: keyword, mode: 'insensitive' } },
          { major: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        major: true,
        cohort: true,
      },
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
      },
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

  // ===========================================================================
  // Portfolio: skills / achievements / certificates / projects
  // Backs the profile "About/Portfolio" tabs. Each list is owned by its user;
  // ownerId is resolved from the JWT (preferred) or body fallback (compat).
  // ===========================================================================

  /** All portfolio sections for a user in one round-trip (read-only, public). */
  async getPortfolio(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const [skills, achievements, certificates, projects] = await Promise.all([
      prisma.userSkill.findMany({
        where: { userId },
        orderBy: { skill: 'asc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.userCertificate.findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.userProject.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { skills, achievements, certificates, projects };
  }

  // ----- Skills -----

  async addSkill(userId: string, skill: string, level = 'beginner') {
    const name = (skill || '').trim();
    if (!name) throw new BadRequestException('Tên kỹ năng không được để trống');
    try {
      return await prisma.userSkill.create({
        data: { userId, skill: name, level },
      });
    } catch {
      // @@unique([userId, skill]) violated.
      throw new ConflictException('Kỹ năng này đã có trong hồ sơ');
    }
  }

  async removeSkill(userId: string, skillId: string) {
    const skill = await prisma.userSkill.findUnique({ where: { id: skillId } });
    if (!skill) throw new NotFoundException('Không tìm thấy kỹ năng');
    if (skill.userId !== userId)
      throw new ForbiddenException('Không thể xóa kỹ năng của người khác');
    return prisma.userSkill.delete({ where: { id: skillId } });
  }

  // ----- Achievements -----

  async addAchievement(userId: string, title: string, description?: string) {
    const name = (title || '').trim();
    if (!name)
      throw new BadRequestException('Tiêu đề thành tích không được để trống');
    return prisma.userAchievement.create({
      data: { userId, title: name, description },
    });
  }

  async removeAchievement(userId: string, achievementId: string) {
    const item = await prisma.userAchievement.findUnique({
      where: { id: achievementId },
    });
    if (!item) throw new NotFoundException('Không tìm thấy thành tích');
    if (item.userId !== userId)
      throw new ForbiddenException('Không thể xóa thành tích của người khác');
    return prisma.userAchievement.delete({ where: { id: achievementId } });
  }

  // ----- Certificates -----

  async addCertificate(
    userId: string,
    data: {
      name: string;
      issuer: string;
      issuedAt: string;
      credentialUrl?: string;
    },
  ) {
    const name = (data?.name || '').trim();
    const issuer = (data?.issuer || '').trim();
    if (!name || !issuer)
      throw new BadRequestException('Tên chứng chỉ và đơn vị cấp là bắt buộc');
    const issuedAt = new Date(data.issuedAt);
    if (isNaN(issuedAt.getTime()))
      throw new BadRequestException('Ngày cấp không hợp lệ');
    return prisma.userCertificate.create({
      data: {
        userId,
        name,
        issuer,
        issuedAt,
        credentialUrl: data.credentialUrl || null,
      },
    });
  }

  async removeCertificate(userId: string, certificateId: string) {
    const item = await prisma.userCertificate.findUnique({
      where: { id: certificateId },
    });
    if (!item) throw new NotFoundException('Không tìm thấy chứng chỉ');
    if (item.userId !== userId)
      throw new ForbiddenException('Không thể xóa chứng chỉ của người khác');
    return prisma.userCertificate.delete({ where: { id: certificateId } });
  }

  // ----- Projects -----

  async addProject(
    userId: string,
    data: {
      title: string;
      description?: string;
      techStack?: string[];
      githubUrl?: string;
      demoUrl?: string;
    },
  ) {
    const title = (data?.title || '').trim();
    if (!title) throw new BadRequestException('Tên dự án không được để trống');
    return prisma.userProject.create({
      data: {
        userId,
        title,
        description: data.description || null,
        techStack: Array.isArray(data.techStack) ? data.techStack : [],
        githubUrl: data.githubUrl || null,
        demoUrl: data.demoUrl || null,
      },
    });
  }

  async removeProject(userId: string, projectId: string) {
    const item = await prisma.userProject.findUnique({
      where: { id: projectId },
    });
    if (!item) throw new NotFoundException('Không tìm thấy dự án');
    if (item.userId !== userId)
      throw new ForbiddenException('Không thể xóa dự án của người khác');
    return prisma.userProject.delete({ where: { id: projectId } });
  }
}

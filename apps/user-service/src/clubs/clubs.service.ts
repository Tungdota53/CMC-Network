import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@campus-connect/database';
import { createStorageProvider, validateUpload } from '@campus-connect/common';
import { join } from 'path';

type UploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class ClubsService {
  private readonly storage = createStorageProvider(
    join(process.cwd(), 'uploads'),
    '/uploads',
  );

  async list(
    filters: {
      search?: string;
      category?: string;
      type?: string;
      joinMode?: string;
      sort?: string;
      page?: string;
      limit?: string;
    } = {},
    viewerId?: string,
  ) {
    const search = filters.search?.trim();
    const where: Prisma.ClubWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    if (filters.category?.trim()) where.category = filters.category.trim();
    if (filters.type?.trim()) where.type = filters.type.trim();
    if (filters.joinMode?.trim()) where.joinMode = filters.joinMode.trim();
    if (!where.status) where.status = 'ACTIVE';

    const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 100);
    const page = Math.max(Number(filters.page) || 1, 1);
    const orderBy = this.resolveOrderBy(filters.sort);

    const clubs = await prisma.club.findMany({
      where,
      include: {
        members: { select: { id: true, userId: true, role: true } },
        owner: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
    return clubs.map((club) => this.toDto(club, viewerId));
  }

  async create(ownerId: string, data: Record<string, unknown>) {
    const club = await prisma.club.create({
      data: {
        name: this.required(data.name, 'Tên CLB'),
        description: this.optional(data.description),
        category: this.optional(data.category, 120),
        type: this.enumString(
          data.type,
          ['OFFICIAL_CLUB', 'COMMUNITY'],
          'COMMUNITY',
        ),
        visibility: this.enumString(
          data.visibility,
          ['PUBLIC', 'PRIVATE', 'UNLISTED'],
          'PUBLIC',
        ),
        joinMode: this.enumString(
          data.joinMode,
          ['OPEN', 'APPROVAL', 'INVITE_ONLY'],
          'OPEN',
        ),
        logoUrl: this.optional(data.logoUrl, 500),
        bannerUrl: this.optional(data.bannerUrl, 500),
        rules: this.optional(data.rules, 3000),
        tags: this.stringArray(data.tags, 12),
        location: this.optional(data.location, 255),
        contactEmail: this.optional(data.contactEmail, 255),
        socialLinks: this.jsonObject(data.socialLinks),
        ownerId,
        members: { create: { userId: ownerId, role: 'OWNER' } },
      },
      include: {
        members: { select: { id: true, userId: true, role: true } },
        owner: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    return this.toDto(club, ownerId);
  }

  async detail(id: string, viewerId?: string) {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, avatarUrl: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                major: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        joinRequests: viewerId
          ? { where: { userId: viewerId }, select: { status: true } }
          : false,
      },
    });
    if (!club) throw new NotFoundException('Không tìm thấy CLB');
    return { ...this.toDto(club, viewerId), members: club.members };
  }

  async update(id: string, userId: string, data: Record<string, unknown>) {
    await this.assertOwner(id, userId);
    const club = await prisma.club.update({
      where: { id },
      data: {
        name:
          data.name === undefined
            ? undefined
            : this.required(data.name, 'Tên CLB'),
        description:
          data.description === undefined
            ? undefined
            : this.optional(data.description),
        category:
          data.category === undefined
            ? undefined
            : this.optional(data.category, 120),
        type:
          data.type === undefined
            ? undefined
            : this.enumString(
                data.type,
                ['OFFICIAL_CLUB', 'COMMUNITY'],
                'COMMUNITY',
              ),
        visibility:
          data.visibility === undefined
            ? undefined
            : this.enumString(
                data.visibility,
                ['PUBLIC', 'PRIVATE', 'UNLISTED'],
                'PUBLIC',
              ),
        joinMode:
          data.joinMode === undefined
            ? undefined
            : this.enumString(
                data.joinMode,
                ['OPEN', 'APPROVAL', 'INVITE_ONLY'],
                'OPEN',
              ),
        logoUrl:
          data.logoUrl === undefined
            ? undefined
            : this.optional(data.logoUrl, 500),
        bannerUrl:
          data.bannerUrl === undefined
            ? undefined
            : this.optional(data.bannerUrl, 500),
        rules:
          data.rules === undefined
            ? undefined
            : this.optional(data.rules, 3000),
        tags:
          data.tags === undefined ? undefined : this.stringArray(data.tags, 12),
        location:
          data.location === undefined
            ? undefined
            : this.optional(data.location, 255),
        contactEmail:
          data.contactEmail === undefined
            ? undefined
            : this.optional(data.contactEmail, 255),
        socialLinks:
          data.socialLinks === undefined
            ? undefined
            : this.jsonObject(data.socialLinks),
      },
      include: {
        members: { select: { id: true, userId: true, role: true } },
        owner: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    return this.toDto(club, userId);
  }

  async delete(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await prisma.club.delete({ where: { id } });
    return { success: true };
  }

  async uploadImage(
    clubId: string,
    userId: string,
    file: UploadFile,
    kind: 'logo' | 'banner',
  ) {
    await this.assertOwnerOrAdmin(clubId, userId);
    validateUpload(file, {
      maxSizeBytes: 10 * 1024 * 1024,
      allowedMimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
    });

    const stored = await this.storage.put({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size ?? file.buffer.length,
      folder: 'clubs',
    });

    const club = await prisma.club.update({
      where: { id: clubId },
      data:
        kind === 'logo' ? { logoUrl: stored.url } : { bannerUrl: stored.url },
      include: {
        members: { select: { id: true, userId: true, role: true } },
        owner: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    return this.toDto(club, userId);
  }

  async join(clubId: string, userId: string) {
    const club = await this.ensureClub(clubId);
    const existing = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId } },
    });
    if (existing) return this.detail(clubId, userId);

    if (club.joinMode === 'INVITE_ONLY') {
      throw new BadRequestException('CLB này chỉ tham gia bằng lời mời');
    }

    if (club.joinMode === 'APPROVAL') {
      await prisma.clubJoinRequest.upsert({
        where: { clubId_userId: { clubId, userId } },
        create: { clubId, userId, status: 'PENDING' },
        update: { status: 'PENDING', message: null },
      });
      return this.detail(clubId, userId);
    }

    await prisma.clubMember.upsert({
      where: { clubId_userId: { clubId, userId } },
      create: { clubId, userId, role: 'MEMBER' },
      update: {},
    });
    return this.detail(clubId, userId);
  }

  async leave(clubId: string, userId: string) {
    const club = await this.ensureClub(clubId);
    if (club.ownerId === userId)
      throw new BadRequestException('Chủ CLB không thể rời CLB');
    const member = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId } },
    });
    if (!member) throw new NotFoundException('Bạn chưa tham gia CLB này');
    await prisma.clubMember.delete({ where: { id: member.id } });
    return { success: true };
  }

  async listJoinRequests(clubId: string, userId: string) {
    await this.assertOwnerOrAdmin(clubId, userId);
    return prisma.clubJoinRequest.findMany({
      where: { clubId, status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            major: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveJoinRequest(clubId: string, requestId: string, userId: string) {
    await this.assertOwnerOrAdmin(clubId, userId);
    const request = await prisma.clubJoinRequest.findFirst({
      where: { id: requestId, clubId, status: 'PENDING' },
    });
    if (!request)
      throw new NotFoundException('Không tìm thấy yêu cầu tham gia');

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.clubJoinRequest.updateMany({
        where: { id: request.id, status: 'PENDING' },
        data: { status: 'APPROVED' },
      });
      if (claimed.count !== 1) {
        throw new NotFoundException('Không tìm thấy yêu cầu tham gia');
      }

      await tx.clubMember.upsert({
        where: { clubId_userId: { clubId, userId: request.userId } },
        create: { clubId, userId: request.userId, role: 'MEMBER' },
        update: {},
      });
    });
    return { success: true };
  }

  async rejectJoinRequest(clubId: string, requestId: string, userId: string) {
    await this.assertOwnerOrAdmin(clubId, userId);
    const request = await prisma.clubJoinRequest.findFirst({
      where: { id: requestId, clubId, status: 'PENDING' },
    });
    if (!request)
      throw new NotFoundException('Không tìm thấy yêu cầu tham gia');
    await prisma.clubJoinRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED' },
    });
    return { success: true };
  }

  async updateMemberRole(
    clubId: string,
    memberId: string,
    userId: string,
    role: unknown,
  ) {
    const actor = await this.assertOwnerOrAdmin(clubId, userId);
    const nextRole = this.enumString(
      role,
      ['ADMIN', 'MODERATOR', 'MEMBER'],
      'MEMBER',
    );
    const member = await prisma.clubMember.findFirst({
      where: { id: memberId, clubId },
    });
    if (!member) throw new NotFoundException('Không tìm thấy thành viên');
    if (member.role === 'OWNER')
      throw new BadRequestException('Không thể đổi vai trò chủ CLB');
    if (nextRole === 'ADMIN' && actor.role !== 'OWNER') {
      throw new ForbiddenException(
        'Chỉ chủ CLB mới được cấp quyền quản trị viên',
      );
    }
    const updated = await prisma.clubMember.update({
      where: { id: member.id },
      data: { role: nextRole },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, major: true },
        },
      },
    });
    return updated;
  }

  async removeMember(clubId: string, memberId: string, userId: string) {
    const actor = await this.assertOwnerOrAdmin(clubId, userId);
    const member = await prisma.clubMember.findFirst({
      where: { id: memberId, clubId },
    });
    if (!member) throw new NotFoundException('Không tìm thấy thành viên');
    if (member.role === 'OWNER')
      throw new BadRequestException('Không thể xoá chủ CLB khỏi CLB');
    if (member.role === 'ADMIN' && actor.role !== 'OWNER') {
      throw new ForbiddenException('Chỉ chủ CLB mới được xoá quản trị viên');
    }
    await prisma.clubMember.delete({ where: { id: member.id } });
    return { success: true };
  }

  async analytics(clubId: string, userId: string) {
    await this.assertOwnerOrAdmin(clubId, userId);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [members, pendingRequests, posts, newMembers7d, posts7d] =
      await Promise.all([
        prisma.clubMember.count({ where: { clubId } }),
        prisma.clubJoinRequest.count({ where: { clubId, status: 'PENDING' } }),
        prisma.post.count({ where: { clubId, deletedAt: null } }),
        prisma.clubMember.count({
          where: { clubId, joinedAt: { gte: since } },
        }),
        prisma.post.count({
          where: { clubId, deletedAt: null, createdAt: { gte: since } },
        }),
      ]);
    return { members, pendingRequests, posts, newMembers7d, posts7d };
  }

  private async ensureClub(id: string) {
    const club = await prisma.club.findUnique({
      where: { id },
      select: { id: true, ownerId: true, joinMode: true },
    });
    if (!club) throw new NotFoundException('Không tìm thấy CLB');
    return club;
  }

  private async assertOwner(id: string, userId: string) {
    const club = await this.ensureClub(id);
    if (club.ownerId !== userId)
      throw new ForbiddenException('Chỉ chủ CLB mới có quyền này');
    return club;
  }

  private async assertOwnerOrAdmin(id: string, userId: string) {
    const member = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId: id, userId } },
      select: { role: true },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Chỉ quản trị viên CLB mới có quyền này');
    }
    return member;
  }

  private toDto(club: any, viewerId?: string) {
    const { members, joinRequests, ...clubData } = club;
    const memberCount = members?.length ?? 0;
    const myMembership = viewerId
      ? members?.find((member: any) => member.userId === viewerId)
      : undefined;
    return {
      ...clubData,
      memberCount,
      type: clubData.type ?? 'COMMUNITY',
      isVerified: Boolean(clubData.verifiedAt),
      isJoined: Boolean(myMembership),
      isMember: Boolean(myMembership),
      myRole: myMembership?.role ?? null,
      myJoinRequestStatus: joinRequests?.[0]?.status ?? null,
    };
  }

  private required(value: unknown, label: string) {
    const text = (
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : ''
    ).trim();
    if (!text) throw new BadRequestException(`${label} không được để trống`);
    return text.slice(0, 255);
  }

  private optional(value: unknown, maxLength = 1000) {
    const text = (
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : ''
    ).trim();
    return text ? text.slice(0, maxLength) : null;
  }

  private enumString(value: unknown, allowed: string[], fallback: string) {
    const text = this.optional(value, 80);
    return text && allowed.includes(text) ? text : fallback;
  }

  private stringArray(value: unknown, maxItems: number) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems)
      .map((item) => item.slice(0, 40));
  }

  private jsonObject(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return undefined;
    return value as Prisma.InputJsonObject;
  }

  private resolveOrderBy(sort?: string): Prisma.ClubOrderByWithRelationInput[] {
    if (sort === 'featured')
      return [{ featured: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'name') return [{ name: 'asc' }];
    return [{ createdAt: 'desc' }];
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

@Injectable()
export class AdminService {
  /** Platform-wide analytics for the admin dashboard. */
  async getAnalytics() {
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      dau,
      mau,
      newUsersThisWeek,
      totalPosts,
      postsThisWeek,
      totalComments,
      totalMaterials,
      totalProducts,
      pendingReports,
      suspendedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: dayAgo } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: monthAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.comment.count(),
      prisma.material.count(),
      prisma.product.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { isSuspended: true } }),
    ]);

    return {
      users: {
        total: totalUsers,
        dau,
        mau,
        newThisWeek: newUsersThisWeek,
        suspended: suspendedUsers,
      },
      content: {
        posts: totalPosts,
        postsThisWeek,
        comments: totalComments,
        materials: totalMaterials,
        products: totalProducts,
      },
      moderation: { pendingReports },
      generatedAt: new Date().toISOString(),
    };
  }

  /** Daily new-user and new-post counts for the last N days (for charts). */
  async getGrowth(days = 14) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.post.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const bucket = (rows: { createdAt: Date }[]) => {
      const map = new Map<string, number>();
      for (const r of rows) {
        const key = r.createdAt.toISOString().slice(0, 10);
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return map;
    };

    const userMap = bucket(users);
    const postMap = bucket(posts);
    const series: { date: string; users: number; posts: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      series.push({
        date: d,
        users: userMap.get(d) ?? 0,
        posts: postMap.get(d) ?? 0,
      });
    }
    return series;
  }

  /** ----- Reports / moderation ----- */

  async createReport(
    reporterId: string,
    data: { targetId: string; targetType: string; reason: string },
  ) {
    return prisma.report.create({
      data: {
        reporterId,
        targetId: data.targetId,
        targetType: data.targetType as never,
        reason: data.reason,
      },
    });
  }

  async listReports(
    filters: { status?: string; targetType?: string; q?: string } = {},
  ) {
    return prisma.report.findMany({
      where: {
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.targetType
          ? { targetType: filters.targetType as never }
          : {}),
        ...(filters.q
          ? {
              OR: [
                { reason: { contains: filters.q, mode: 'insensitive' } },
                ...(filters.q.length === 36
                  ? [{ targetId: { equals: filters.q } }]
                  : []),
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async resolveReport(
    actorId: string,
    reportId: string,
    status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED',
    note?: string,
  ) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    return prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: { status: status as never },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'REPORT_STATUS_UPDATED',
          metadata: {
            reportId,
            status,
            note,
            targetId: report.targetId,
            targetType: report.targetType,
          },
        },
      });
      return updated;
    });
  }

  /** Delete reported content by type. Used by moderators. */
  async deleteContent(actorId: string, targetType: string, targetId: string) {
    switch (targetType) {
      case 'POST':
        await prisma.post.delete({ where: { id: targetId } });
        break;
      case 'COMMENT':
        await prisma.comment.delete({ where: { id: targetId } });
        break;
      case 'PRODUCT':
        await prisma.product.delete({ where: { id: targetId } });
        break;
      default:
        throw new NotFoundException(
          `Không hỗ trợ xóa loại nội dung: ${targetType}`,
        );
    }
    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'CONTENT_DELETED_BY_MODERATOR',
        metadata: { targetType, targetId },
      },
    });
    return { deleted: true, targetType, targetId };
  }

  async listAuditLogs(limit = 50) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      include: {
        actor: { select: { id: true, fullName: true, avatarUrl: true } },
        target: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async listUsers(filters: { search?: string; role?: string } = {}) {
    const users = await prisma.user.findMany({
      where: {
        ...(filters.role && filters.role !== 'ALL'
          ? { role: filters.role as never }
          : {}),
        ...(filters.search
          ? {
              OR: [
                { fullName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        hasBlueBadge: true,
        createdAt: true,
        isSuspended: true,
      },
    });

    return users.map((u) => ({
      ...u,
      status: u.isSuspended ? 'BANNED' : 'ACTIVE',
    }));
  }

  async updateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'BANNED' | 'PENDING',
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: { isSuspended: status === 'BANNED' },
    });
  }

  async toggleBlueBadge(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return prisma.user.update({
      where: { id: userId },
      data: { hasBlueBadge: !user.hasBlueBadge },
    });
  }
}

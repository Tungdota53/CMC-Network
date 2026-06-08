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
      users: { total: totalUsers, dau, mau, newThisWeek: newUsersThisWeek, suspended: suspendedUsers },
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
      prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.post.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
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
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      series.push({ date: d, users: userMap.get(d) ?? 0, posts: postMap.get(d) ?? 0 });
    }
    return series;
  }

  /** ----- Reports / moderation ----- */

  async createReport(reporterId: string, data: { targetId: string; targetType: string; reason: string }) {
    return prisma.report.create({
      data: {
        reporterId,
        targetId: data.targetId,
        targetType: data.targetType as never,
        reason: data.reason,
      },
    });
  }

  async listReports(status?: string) {
    return prisma.report.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  async resolveReport(reportId: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    return prisma.report.update({ where: { id: reportId }, data: { status: status as never } });
  }

  /** Delete reported content by type. Used by moderators. */
  async deleteContent(targetType: string, targetId: string) {
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
        throw new NotFoundException(`Không hỗ trợ xóa loại nội dung: ${targetType}`);
    }
    return { deleted: true, targetType, targetId };
  }
}

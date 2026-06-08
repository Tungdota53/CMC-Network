import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

// Điểm thưởng cho từng hành động uy tín.
const POINTS: Record<string, number> = {
  POST_CREATED: 2,
  COMMENT_CREATED: 1,
  MATERIAL_UPLOADED: 10,
  MATERIAL_DOWNLOADED: 1,
  MENTOR_SESSION_COMPLETED: 15,
  EVENT_ORGANIZED: 20,
  EVENT_ATTENDED: 5,
  PRODUCT_SOLD: 8,
  HELPFUL_ANSWER: 5,
  REPORT_SUBMITTED: 1,
  REPORT_RESOLVED: 3,
};

type ReputationAction = keyof typeof POINTS;

// Ngưỡng điểm để mở khóa huy hiệu theo cấp độ tổng quát.
const SCORE_BADGES: { threshold: number; badge: string }[] = [
  { threshold: 100, badge: 'ACTIVE_SHARER' },
  { threshold: 500, badge: 'TOP_CONTRIBUTOR' },
];

@Injectable()
export class ReputationService {
  /** Ghi nhận một hành động uy tín, cộng điểm và xét trao huy hiệu. */
  async addPoints(userId: string, action: ReputationAction, reason?: string) {
    const points = POINTS[action] ?? 0;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const [, updatedUser] = await prisma.$transaction([
      prisma.reputationHistory.create({
        data: { userId, action: action as never, points, reason },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { reputationScore: { increment: points } },
        select: { id: true, reputationScore: true },
      }),
    ]);

    const newBadges = await this.checkScoreBadges(userId, updatedUser.reputationScore);

    return { reputationScore: updatedUser.reputationScore, pointsAdded: points, newBadges };
  }

  /** Trao huy hiệu khi vượt ngưỡng điểm, bỏ qua nếu đã có. */
  private async checkScoreBadges(userId: string, score: number) {
    const earned: string[] = [];
    for (const { threshold, badge } of SCORE_BADGES) {
      if (score >= threshold) {
        const existing = await prisma.userBadge.findUnique({
          where: { userId_badge: { userId, badge: badge as never } },
        });
        if (!existing) {
          await prisma.userBadge.create({ data: { userId, badge: badge as never } });
          earned.push(badge);
        }
      }
    }
    return earned;
  }

  /** Trao trực tiếp một huy hiệu (dùng cho các mốc đặc thù). */
  async awardBadge(userId: string, badge: string) {
    return prisma.userBadge.upsert({
      where: { userId_badge: { userId, badge: badge as never } },
      create: { userId, badge: badge as never },
      update: {},
    });
  }

  /** Lịch sử điểm uy tín của user. */
  async getHistory(userId: string) {
    return prisma.reputationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /** Huy hiệu + điểm hiện tại của user. */
  async getUserReputation(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        reputationScore: true,
        badges: { select: { badge: true, earnedAt: true }, orderBy: { earnedAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  /** Bảng xếp hạng theo điểm uy tín. */
  async getLeaderboard(limit = 20) {
    return prisma.user.findMany({
      where: { isSuspended: false },
      orderBy: { reputationScore: 'desc' },
      take: limit,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        major: true,
        cohort: true,
        reputationScore: true,
        badges: { select: { badge: true } },
      },
    });
  }
}

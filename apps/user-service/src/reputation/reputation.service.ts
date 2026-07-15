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

const BADGE_CATALOG = [
  {
    badge: 'ACTIVE_SHARER',
    name: 'Người chia sẻ',
    description: 'Đạt 100 XP uy tín',
    category: 'CONTRIBUTION',
    iconName: 'Share2',
    requiredPoints: 100,
  },
  {
    badge: 'TOP_CONTRIBUTOR',
    name: 'Top contributor',
    description: 'Đạt 500 XP uy tín',
    category: 'CONTRIBUTION',
    iconName: 'Trophy',
    requiredPoints: 500,
  },
  {
    badge: 'MARKETPLACE_TRUSTED',
    name: 'Giao dịch tin cậy',
    description: 'Bán sản phẩm thành công',
    category: 'SPECIAL',
    iconName: 'BadgeCheck',
    requiredPoints: 80,
  },
  {
    badge: 'EVENT_ORGANIZER',
    name: 'Người tổ chức',
    description: 'Tổ chức sự kiện cộng đồng',
    category: 'SPECIAL',
    iconName: 'CalendarCheck',
    requiredPoints: 120,
  },
  {
    badge: 'MENTOR_EXCELLENT',
    name: 'Mentor xuất sắc',
    description: 'Hoàn thành nhiều phiên mentor',
    category: 'MENTOR',
    iconName: 'GraduationCap',
    requiredPoints: 150,
  },
] as const;

@Injectable()
export class ReputationService {
  /** Ghi nhận một hành động uy tín, cộng điểm và xét trao huy hiệu. */
  async addPoints(userId: string, action: ReputationAction, reason?: string) {
    const points = POINTS[action] ?? 0;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Idempotent ledger: callers pass a stable reason/reference, e.g. productId/sessionId/eventId.
    // If same user/action/reason already exists, do not double-award XP.
    if (reason) {
      const existing = await prisma.reputationHistory.findFirst({
        where: { userId, action: action as never, reason },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        const current = await this.getUserReputation(userId);
        return {
          reputationScore: current.reputationScore,
          pointsAdded: 0,
          newBadges: [],
          idempotent: true,
        };
      }
    }

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

    const newBadges = await this.checkScoreBadges(
      userId,
      updatedUser.reputationScore,
    );

    return {
      reputationScore: updatedUser.reputationScore,
      pointsAdded: points,
      newBadges,
    };
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
          await prisma.userBadge.create({
            data: { userId, badge: badge as never },
          });
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
    const [user, history] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          reputationScore: true,
          badges: {
            select: { badge: true, earnedAt: true },
            orderBy: { earnedAt: 'desc' },
          },
        },
      }),
      this.getHistory(userId),
    ]);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const earned = new Map(user.badges.map((b) => [b.badge, b.earnedAt]));
    const badges = BADGE_CATALOG.map((item) => {
      const earnedAt = earned.get(item.badge);
      return {
        id: item.badge,
        badge: item.badge,
        name: item.name,
        description: item.description,
        category: item.category,
        iconName: item.iconName,
        requiredPoints: item.requiredPoints,
        progress: Math.min(user.reputationScore, item.requiredPoints),
        isUnlocked: Boolean(earnedAt),
        earnedAt,
      };
    });

    return {
      ...user,
      xp: user.reputationScore,
      level: Math.floor(user.reputationScore / 100) + 1,
      nextLevelXp: (Math.floor(user.reputationScore / 100) + 1) * 100,
      badges,
      history,
    };
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

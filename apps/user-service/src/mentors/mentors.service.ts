import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@campus-connect/database';

const MENTOR_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
  major: true,
  cohort: true,
  department: true,
  isVerified: true,
  hasBlueBadge: true,
} as const;

@Injectable()
export class MentorsService {
  /** Danh sách mentor (kèm thông tin user + badge). */
  async getMentors(expertise?: string) {
    const profiles = await prisma.mentorProfile.findMany({
      where: expertise ? { expertise: { has: expertise } } : undefined,
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
      include: {
        user: {
          select: { ...MENTOR_SELECT, badges: { select: { badge: true } } },
        },
      },
    });

    return profiles.map((profile) => this.toMentorCard(profile));
  }

  /** Chi tiết một mentor theo userId, kèm review gần đây. */
  async getMentorProfile(userId: string) {
    const profile = await prisma.mentorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            ...MENTOR_SELECT,
            bio: true,
            badges: { select: { badge: true } },
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Không tìm thấy mentor');

    const reviews = await prisma.mentorReview.findMany({
      where: { mentorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        mentee: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return { ...this.toMentorCard(profile), reviews };
  }

  /** Đăng ký (hoặc cập nhật) làm mentor. */
  async registerMentor(
    userId: string,
    data: {
      bio?: string;
      expertise?: string[];
      gpa?: number;
      schedule?: unknown;
    },
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    return prisma.mentorProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: data.bio,
        expertise: data.expertise ?? [],
        gpa: data.gpa,
        schedule: data.schedule as never,
      },
      update: {
        bio: data.bio,
        expertise: data.expertise ?? [],
        gpa: data.gpa,
        schedule: data.schedule as never,
      },
    });
  }

  /** Mentee đặt lịch với mentor. */
  async createBooking(
    menteeId: string,
    data: {
      mentorId: string;
      scheduledAt: string;
      topic?: string;
      notes?: string;
    },
  ) {
    if (!data.mentorId || !data.scheduledAt) {
      throw new BadRequestException('Thiếu mentorId hoặc thời gian đặt lịch');
    }
    if (data.mentorId === menteeId) {
      throw new BadRequestException('Không thể đặt lịch với chính mình');
    }
    const scheduledAt = new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Thời gian đặt lịch không hợp lệ');
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: data.mentorId },
      select: { id: true },
    });
    if (!mentorProfile) throw new NotFoundException('Mentor không tồn tại');

    return prisma.$transaction(async (tx) => {
      // Serialize bookings for one mentor so concurrent requests cannot both
      // pass the overlap check. PostgreSQL releases this lock at transaction end.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.mentorId}))`;

      const windowStart = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(scheduledAt.getTime() + 30 * 60 * 1000);
      const conflict = await tx.mentorBooking.findFirst({
        where: {
          mentorId: data.mentorId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          scheduledAt: { gte: windowStart, lte: windowEnd },
        },
      });
      if (conflict) {
        throw new BadRequestException('Mentor đã có lịch gần khung giờ này');
      }

      return tx.mentorBooking.create({
        data: {
          mentorId: data.mentorId,
          menteeId,
          scheduledAt,
          topic: data.topic,
          notes: data.notes,
        },
        include: {
          mentor: { select: MENTOR_SELECT },
          mentee: { select: MENTOR_SELECT },
        },
      });
    });
  }

  /** Danh sách lịch của user (vai trò mentor hoặc mentee). */
  async getBookings(userId: string, role: 'mentor' | 'mentee') {
    const where =
      role === 'mentor' ? { mentorId: userId } : { menteeId: userId };
    return prisma.mentorBooking.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        mentor: { select: MENTOR_SELECT },
        mentee: { select: MENTOR_SELECT },
      },
    });
  }

  /** Mentor cập nhật trạng thái booking (xác nhận / hoàn thành / hủy). */
  async updateBookingStatus(
    userId: string,
    bookingId: string,
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
  ) {
    const booking = await prisma.mentorBooking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy lịch hẹn');
    const isMentor = booking.mentorId === userId;
    const isMentee = booking.menteeId === userId;
    if (!isMentor && !isMentee) {
      throw new BadRequestException('Bạn không có quyền với lịch hẹn này');
    }

    if (status !== 'CANCELLED' && !isMentor) {
      throw new BadRequestException(
        'Chỉ mentor mới có quyền cập nhật trạng thái này',
      );
    }

    const allowedFrom: Record<typeof status, string[]> = {
      CONFIRMED: ['PENDING'],
      COMPLETED: ['CONFIRMED'],
      CANCELLED: ['PENDING', 'CONFIRMED'],
      NO_SHOW: ['CONFIRMED'],
    };
    if (!allowedFrom[status].includes(booking.status)) {
      throw new BadRequestException('Chuyển trạng thái lịch hẹn không hợp lệ');
    }

    return prisma.$transaction(async (tx) => {
      const changed = await tx.mentorBooking.updateMany({
        where: { id: bookingId, status: booking.status },
        data: { status },
      });
      if (changed.count !== 1) {
        throw new BadRequestException(
          'Lịch hẹn đã được cập nhật bởi yêu cầu khác',
        );
      }

      if (status === 'COMPLETED') {
        await tx.mentorProfile.update({
          where: { userId: booking.mentorId },
          data: { totalSessions: { increment: 1 } },
        });
      }

      return tx.mentorBooking.findUnique({ where: { id: bookingId } });
    });
  }

  /** Mentee đánh giá mentor sau buổi học; cập nhật lại rating trung bình. */
  async reviewMentor(
    menteeId: string,
    data: { bookingId: string; rating: number; comment?: string },
  ) {
    const booking = await prisma.mentorBooking.findUnique({
      where: { id: data.bookingId },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy lịch hẹn');
    if (booking.menteeId !== menteeId) {
      throw new BadRequestException('Bạn không phải mentee của buổi học này');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Chỉ đánh giá được buổi học đã hoàn thành');
    }
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5');
    }

    const review = await prisma.mentorReview.create({
      data: {
        bookingId: data.bookingId,
        mentorId: booking.mentorId,
        menteeId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Tính lại rating trung bình của mentor.
    const stats = await prisma.mentorReview.aggregate({
      where: { mentorId: booking.mentorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.mentorProfile.update({
      where: { userId: booking.mentorId },
      data: {
        rating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating,
      },
    });

    return review;
  }

  private toMentorCard(profile: {
    id: string;
    userId: string;
    bio: string | null;
    expertise: string[];
    gpa: number | null;
    totalSessions: number;
    rating: number;
    reviewCount: number;
    status: string;
    schedule: unknown;
    user: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
      major: string | null;
      cohort: string | null;
      department: string | null;
      isVerified: boolean;
      bio?: string | null;
      badges: { badge: string }[];
    };
  }) {
    return {
      id: profile.userId,
      profileId: profile.id,
      name: profile.user.fullName,
      avatar: profile.user.avatarUrl,
      major: profile.user.major,
      cohort: profile.user.cohort,
      department: profile.user.department,
      bio: profile.bio ?? profile.user.bio ?? '',
      expertise: profile.expertise,
      gpa: profile.gpa,
      rating: profile.rating,
      reviews: profile.reviewCount,
      sessions: profile.totalSessions,
      available: profile.status === 'ACTIVE',
      status: profile.status,
      schedule: profile.schedule ?? [],
      badges: profile.user.badges.map((b) => b.badge),
    };
  }
}

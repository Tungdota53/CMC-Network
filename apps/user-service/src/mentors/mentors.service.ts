import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

const MENTOR_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
  major: true,
  cohort: true,
  department: true,
  isVerified: true,
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
          select: { ...MENTOR_SELECT, bio: true, badges: { select: { badge: true } } },
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
    data: { bio?: string; expertise?: string[]; gpa?: number; schedule?: unknown },
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
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
    data: { mentorId: string; scheduledAt: string; topic?: string; notes?: string },
  ) {
    if (!data.mentorId || !data.scheduledAt) {
      throw new BadRequestException('Thiếu mentorId hoặc thời gian đặt lịch');
    }
    if (data.mentorId === menteeId) {
      throw new BadRequestException('Không thể đặt lịch với chính mình');
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: data.mentorId },
      select: { id: true },
    });
    if (!mentorProfile) throw new NotFoundException('Mentor không tồn tại');

    return prisma.mentorBooking.create({
      data: {
        mentorId: data.mentorId,
        menteeId,
        scheduledAt: new Date(data.scheduledAt),
        topic: data.topic,
        notes: data.notes,
      },
      include: {
        mentor: { select: MENTOR_SELECT },
        mentee: { select: MENTOR_SELECT },
      },
    });
  }

  /** Danh sách lịch của user (vai trò mentor hoặc mentee). */
  async getBookings(userId: string, role: 'mentor' | 'mentee') {
    const where = role === 'mentor' ? { mentorId: userId } : { menteeId: userId };
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
    const booking = await prisma.mentorBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Không tìm thấy lịch hẹn');
    if (booking.mentorId !== userId && booking.menteeId !== userId) {
      throw new BadRequestException('Bạn không có quyền với lịch hẹn này');
    }

    const updated = await prisma.mentorBooking.update({
      where: { id: bookingId },
      data: { status },
    });

    // Khi hoàn thành buổi mentor, tăng tổng số session của mentor.
    if (status === 'COMPLETED') {
      await prisma.mentorProfile.update({
        where: { userId: booking.mentorId },
        data: { totalSessions: { increment: 1 } },
      });
    }

    // Tích hợp đồng bộ Google Calendar
    if (status === 'CONFIRMED') {
      await this.syncWithGoogleCalendar(updated);
    }

    return updated;
  }

  /** Mock Google Calendar Sync */
  private async syncWithGoogleCalendar(booking: any) {
    console.log(`[Google Calendar Sync] Bắt đầu đồng bộ cho booking ${booking.id}...`);
    // Placeholder cho Google API call
    console.log(`[Google Calendar Sync] Đã thêm sự kiện: Mentor Session vào lịch của Mentor và Mentee.`);
  }

  /** Mentee đánh giá mentor sau buổi học; cập nhật lại rating trung bình. */
  async reviewMentor(
    menteeId: string,
    data: { bookingId: string; rating: number; comment?: string },
  ) {
    const booking = await prisma.mentorBooking.findUnique({ where: { id: data.bookingId } });
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

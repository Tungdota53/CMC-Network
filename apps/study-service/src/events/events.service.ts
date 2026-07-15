import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@campus-connect/database';

@Injectable()
export class EventsService {
  async getEvents(status?: string) {
    return prisma.event.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        organizer: {
          select: {
            fullName: true,
            avatarUrl: true,
            isVerified: true,
            hasBlueBadge: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async createEvent(data: any) {
    return prisma.event.create({
      data: {
        organizerId: data.organizerId,
        title: data.title,
        description: data.description,
        type: data.type,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxAttendees: data.maxAttendees,
        status: data.status || 'PUBLISHED',
        qrCodeEnabled: Boolean(data.qrCodeEnabled),
        image: data.image,
      },
    });
  }

  async getEvent(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
            hasBlueBadge: true,
          },
        },
        attendees: {
          select: { id: true, userId: true, status: true, createdAt: true },
        },
      },
    });
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện');
    return event;
  }

  /** Update an event. Only the organizer may edit. */
  async updateEvent(eventId: string, userId: string, data: any) {
    const event = await this.assertOrganizer(eventId, userId);
    return prisma.event.update({
      where: { id: event.id },
      data: {
        title: data.title ?? event.title,
        description: data.description ?? event.description,
        type: data.type ?? event.type,
        location: data.location ?? event.location,
        startDate: data.startDate ? new Date(data.startDate) : event.startDate,
        endDate: data.endDate ? new Date(data.endDate) : event.endDate,
        maxAttendees: data.maxAttendees ?? event.maxAttendees,
        status: data.status ?? event.status,
        qrCodeEnabled: data.qrCodeEnabled ?? event.qrCodeEnabled,
        image: data.image ?? event.image,
      },
    });
  }

  /** Delete an event. Only the organizer may delete. */
  async deleteEvent(eventId: string, userId: string) {
    await this.assertOrganizer(eventId, userId);
    await prisma.event.delete({ where: { id: eventId } });
    return { deleted: true, id: eventId };
  }

  async joinEvent(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện');

    const existing = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) return existing; // already joined — idempotent

    if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
      throw new BadRequestException('Sự kiện đã đủ số lượng người tham gia');
    }

    // Create + increment atomically; swallow the unique-constraint race so a
    // double-submit doesn't double-count or 500.
    try {
      const [attendee] = await prisma.$transaction([
        prisma.eventAttendee.create({ data: { eventId, userId } }),
        prisma.event.update({
          where: { id: eventId },
          data: { attendeeCount: { increment: 1 } },
        }),
      ]);
      return attendee;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        // Lost the race — the row already exists, treat as success.
        return prisma.eventAttendee.findUnique({
          where: { eventId_userId: { eventId, userId } },
        });
      }
      throw err;
    }
  }

  /** Leave an event the user had registered for. */
  async leaveEvent(eventId: string, userId: string) {
    const attendee = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!attendee) throw new NotFoundException('Bạn chưa đăng ký sự kiện này');

    await prisma.$transaction([
      prisma.eventAttendee.delete({ where: { id: attendee.id } }),
      prisma.event.update({
        where: { id: eventId },
        data: { attendeeCount: { decrement: 1 } },
      }),
    ]);

    // Ensure attendeeCount never goes below 0 (defensive fix)
    await prisma.event.updateMany({
      where: { id: eventId, attendeeCount: { lt: 0 } },
      data: { attendeeCount: 0 },
    });

    return { left: true, eventId };
  }

  /** Check a user in (QR). Marks their attendance CHECKED_IN. Idempotent. */
  async checkIn(eventId: string, userId: string) {
    const attendee = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!attendee) throw new NotFoundException('Bạn chưa đăng ký sự kiện này');
    if (attendee.status === 'CHECKED_IN') return attendee; // already checked in

    return prisma.eventAttendee.update({
      where: { id: attendee.id },
      data: { status: 'CHECKED_IN' },
    });
  }

  /** Attendee list (organizer view). */
  async getAttendees(eventId: string) {
    return prisma.eventAttendee.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            studentId: true,
            major: true,
          },
        },
      },
    });
  }

  private async assertOrganizer(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện');
    if (event.organizerId !== userId) {
      throw new ForbiddenException('Chỉ người tổ chức mới có quyền này');
    }
    return event;
  }
}

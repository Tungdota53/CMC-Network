import { Injectable } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

@Injectable()
export class EventsService {
  async getEvents(status?: string) {
    return prisma.event.findMany({
      where: status ? { status: status as any } : undefined,
      include: { organizer: { select: { fullName: true, avatarUrl: true } } },
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

  async joinEvent(eventId: string, userId: string) {
    await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { status: 'REGISTERED' },
      create: { eventId, userId },
    });

    return prisma.event.update({
      where: { id: eventId },
      data: { attendeeCount: { increment: 1 } },
    });
  }
}

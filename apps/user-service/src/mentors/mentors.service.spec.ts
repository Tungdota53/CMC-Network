import { BadRequestException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { MentorsService } from './mentors.service';

jest.mock('@campus-connect/database', () => {
  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    $executeRaw: jest.fn(),
    mentorProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mentorBooking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe('MentorsService — booking consistency', () => {
  let service: MentorsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MentorsService();
  });

  it('serializes slot checks per mentor before creating a booking', async () => {
    jest
      .mocked(prisma.mentorProfile.findUnique)
      .mockResolvedValue({ id: 'profile-1' } as never);
    jest.mocked(prisma.mentorBooking.findFirst).mockResolvedValue(null);
    jest
      .mocked(prisma.mentorBooking.create)
      .mockResolvedValue({ id: 'booking-1' } as never);

    await service.createBooking('mentee-1', {
      mentorId: 'mentor-1',
      scheduledAt: '2026-08-04T09:00:00.000Z',
    });

    expect(prisma.$executeRaw).toHaveBeenCalled();
    expect(prisma.mentorBooking.create).toHaveBeenCalled();
  });

  it('rejects a conflicting slot after acquiring the mentor lock', async () => {
    jest
      .mocked(prisma.mentorProfile.findUnique)
      .mockResolvedValue({ id: 'profile-1' } as never);
    jest
      .mocked(prisma.mentorBooking.findFirst)
      .mockResolvedValue({ id: 'existing' } as never);

    await expect(
      service.createBooking('mentee-1', {
        mentorId: 'mentor-1',
        scheduledAt: '2026-08-04T09:00:00.000Z',
      }),
    ).rejects.toThrow('Mentor đã có lịch gần khung giờ này');
    expect(prisma.mentorBooking.create).not.toHaveBeenCalled();
  });

  it('allows only mentor to complete a confirmed booking and increments once', async () => {
    jest.mocked(prisma.mentorBooking.findUnique).mockResolvedValue({
      id: 'booking-1',
      mentorId: 'mentor-1',
      menteeId: 'mentee-1',
      status: 'CONFIRMED',
    } as never);
    jest
      .mocked(prisma.mentorBooking.updateMany)
      .mockResolvedValue({ count: 1 });
    jest.mocked(prisma.mentorProfile.update).mockResolvedValue({} as never);
    jest
      .mocked(prisma.mentorBooking.findUnique)
      .mockResolvedValueOnce({
        id: 'booking-1',
        mentorId: 'mentor-1',
        menteeId: 'mentee-1',
        status: 'CONFIRMED',
      } as never)
      .mockResolvedValueOnce({ id: 'booking-1', status: 'COMPLETED' } as never);

    await service.updateBookingStatus('mentor-1', 'booking-1', 'COMPLETED');

    expect(prisma.mentorBooking.updateMany).toHaveBeenCalledWith({
      where: { id: 'booking-1', status: 'CONFIRMED' },
      data: { status: 'COMPLETED' },
    });
    expect(prisma.mentorProfile.update).toHaveBeenCalledTimes(1);
  });

  it('rejects mentee completing a booking', async () => {
    jest.mocked(prisma.mentorBooking.findUnique).mockResolvedValue({
      id: 'booking-1',
      mentorId: 'mentor-1',
      menteeId: 'mentee-1',
      status: 'CONFIRMED',
    } as never);

    await expect(
      service.updateBookingStatus('mentee-1', 'booking-1', 'COMPLETED'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.mentorBooking.updateMany).not.toHaveBeenCalled();
  });
});

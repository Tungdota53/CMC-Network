import { ForbiddenException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { LiveStreamsService } from './live-streams.service';

jest.mock('@campus-connect/database', () => ({
  LiveStreamStatus: { LIVE: 'LIVE', ENDED: 'ENDED' },
  prisma: {
    $transaction: jest.fn((callback) => callback(prisma)),
    $executeRaw: jest.fn(),
    liveStream: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('LiveStreamsService', () => {
  const service = new LiveStreamsService();

  beforeEach(() => jest.clearAllMocks());

  it('serializes active-stream checks per host before creating a stream', async () => {
    jest.mocked(prisma.liveStream.findFirst).mockResolvedValue(null);
    jest
      .mocked(prisma.liveStream.create)
      .mockResolvedValue({ id: 'stream-1' } as never);

    await service.create('host-1', { title: 'Campus live' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$executeRaw).toHaveBeenCalled();
    expect(prisma.liveStream.create).toHaveBeenCalledTimes(1);
  });

  it('prevents a host from opening two live streams', async () => {
    jest
      .mocked(prisma.liveStream.findFirst)
      .mockResolvedValue({ id: 'existing' } as never);
    await expect(
      service.create('host-1', { title: 'Campus live' }),
    ).rejects.toThrow('đang phát');
    expect(prisma.$executeRaw).toHaveBeenCalled();
    expect(prisma.liveStream.create).not.toHaveBeenCalled();
  });

  it('allows only the host or an admin to end a stream', async () => {
    jest.mocked(prisma.liveStream.findUnique).mockResolvedValue({
      id: 'stream-1',
      hostId: 'host-1',
      status: 'LIVE',
    } as never);
    await expect(
      service.end('stream-1', 'viewer-1', 'STUDENT'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

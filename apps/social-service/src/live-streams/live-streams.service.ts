import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LiveStreamStatus, prisma } from '@campus-connect/database';
import { randomUUID } from 'crypto';
import { CreateLiveStreamDto } from './dto/create-live-stream.dto';

const hostSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
  studentId: true,
  isVerified: true,
  hasBlueBadge: true,
} as const;

@Injectable()
export class LiveStreamsService {
  listActive() {
    return prisma.liveStream.findMany({
      where: { status: LiveStreamStatus.LIVE },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { host: { select: hostSelect } },
    });
  }

  async getById(id: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: { host: { select: hostSelect } },
    });
    if (!stream) throw new NotFoundException('Không tìm thấy livestream');
    return stream;
  }

  async create(hostId: string, input: CreateLiveStreamDto) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${hostId}))`;

      const active = await tx.liveStream.findFirst({
        where: { hostId, status: LiveStreamStatus.LIVE },
      });
      if (active)
        throw new BadRequestException('Bạn đang phát một livestream khác');
      return tx.liveStream.create({
        data: {
          hostId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          roomName: `live-${randomUUID()}`,
        },
        include: { host: { select: hostSelect } },
      });
    });
  }

  async end(id: string, actorId: string, role?: string) {
    const stream = await this.getById(id);
    if (stream.hostId !== actorId && role !== 'ADMIN') {
      throw new ForbiddenException(
        'Bạn không có quyền kết thúc livestream này',
      );
    }
    if (stream.status === LiveStreamStatus.ENDED) return stream;
    return prisma.liveStream.update({
      where: { id },
      data: { status: LiveStreamStatus.ENDED, endedAt: new Date() },
      include: { host: { select: hostSelect } },
    });
  }
}

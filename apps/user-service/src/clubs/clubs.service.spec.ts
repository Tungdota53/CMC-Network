import { NotFoundException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { ClubsService } from './clubs.service';

jest.mock('@campus-connect/common', () => ({
  createStorageProvider: jest.fn(() => ({ put: jest.fn(), delete: jest.fn() })),
  validateUpload: jest.fn(),
}));

jest.mock('@campus-connect/database', () => ({
  prisma: {
    $transaction: jest.fn((operation) =>
      typeof operation === 'function' ? operation(prisma) : Promise.all(operation),
    ),
    club: { findUnique: jest.fn() },
    clubMember: { findUnique: jest.fn(), upsert: jest.fn() },
    clubJoinRequest: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe('ClubsService — join request consistency', () => {
  const service = new ClubsService();

  beforeEach(() => jest.clearAllMocks());

  it('claims a pending join request before adding the member', async () => {
    jest.mocked(prisma.clubMember.findUnique).mockResolvedValue({ role: 'OWNER' } as never);
    jest.mocked(prisma.clubJoinRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      userId: 'student-1',
    } as never);
    jest.mocked(prisma.clubJoinRequest.updateMany).mockResolvedValue({ count: 1 });

    await service.approveJoinRequest('club-1', 'request-1', 'owner-1');

    expect(prisma.clubJoinRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'request-1', status: 'PENDING' },
      data: { status: 'APPROVED' },
    });
    expect(prisma.clubMember.upsert).toHaveBeenCalledTimes(1);
  });

  it('does not add a member when another reviewer already handled the request', async () => {
    jest.mocked(prisma.clubMember.findUnique).mockResolvedValue({ role: 'OWNER' } as never);
    jest.mocked(prisma.clubJoinRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      userId: 'student-1',
    } as never);
    jest.mocked(prisma.clubJoinRequest.updateMany).mockResolvedValue({ count: 0 });

    await expect(
      service.approveJoinRequest('club-1', 'request-1', 'owner-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.clubMember.upsert).not.toHaveBeenCalled();
  });
});

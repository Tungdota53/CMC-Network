import { BadRequestException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { StudyService } from './study.service';

jest.mock('@campus-connect/database', () => {
  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    studyGroup: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    joinRequest: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    studyGroupMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    conversationMember: {
      createMany: jest.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    ConversationType: { GROUP: 'GROUP' },
  };
});

describe('StudyService — join capacity', () => {
  let service: StudyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StudyService();
    jest.mocked(prisma.studyGroup.findUnique).mockResolvedValue({
      id: 'group-1',
      creatorId: 'creator-1',
      memberCount: 9,
      maxMembers: 10,
      conversationId: 'conversation-1',
    } as never);
    jest.mocked(prisma.joinRequest.findFirst).mockResolvedValue({
      id: 'request-1',
      groupId: 'group-1',
      userId: 'user-1',
      status: 'PENDING',
    } as never);
    jest.mocked(prisma.studyGroupMember.findUnique).mockResolvedValue(null);
  });

  it('reserves capacity conditionally in the same transaction as membership', async () => {
    jest.mocked(prisma.studyGroup.updateMany).mockResolvedValue({ count: 1 });
    jest.mocked(prisma.studyGroupMember.create).mockResolvedValue({} as never);
    jest.mocked(prisma.joinRequest.update).mockResolvedValue({} as never);
    jest
      .mocked(prisma.conversationMember.createMany)
      .mockResolvedValue({ count: 1 });

    await expect(
      service.respondJoinRequest('group-1', 'creator-1', 'request-1', 'accept'),
    ).resolves.toEqual({ status: 'APPROVED', requestId: 'request-1' });

    expect(prisma.studyGroup.updateMany).toHaveBeenCalledWith({
      where: { id: 'group-1', memberCount: { lt: 10 } },
      data: { memberCount: { increment: 1 } },
    });
    expect(prisma.conversationMember.createMany).toHaveBeenCalledWith({
      data: [
        { conversationId: 'conversation-1', userId: 'user-1', role: 'member' },
      ],
      skipDuplicates: true,
    });
  });

  it('rejects approval when concurrent request consumed the final slot', async () => {
    jest.mocked(prisma.studyGroup.updateMany).mockResolvedValue({ count: 0 });

    await expect(
      service.respondJoinRequest('group-1', 'creator-1', 'request-1', 'accept'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.studyGroupMember.create).not.toHaveBeenCalled();
    expect(prisma.joinRequest.update).not.toHaveBeenCalled();
  });
});

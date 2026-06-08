import { NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { UsersService } from './users.service';

jest.mock('@campus-connect/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    friendship: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    friendRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    userSkill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userAchievement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userCertificate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userProject: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;
const notifier = { push: jest.fn().mockResolvedValue(undefined) };

describe('UsersService friendship', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(notifier as never);
  });

  it('creates a pending friend request when users are not connected', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: 'receiver-1' } as never);
    mockedPrisma.friendship.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.friendRequest.findMany.mockResolvedValueOnce([] as never);
    mockedPrisma.friendRequest.create.mockResolvedValueOnce({
      id: 'request-1',
      senderId: 'sender-1',
      receiverId: 'receiver-1',
      status: 'pending',
      sender: { fullName: 'Alice' },
    } as never);

    const result = await service.sendFriendRequest('sender-1', 'receiver-1');

    expect(mockedPrisma.friendRequest.create).toHaveBeenCalled();
    expect(result.id).toBe('request-1');
    // Receiver is notified of the incoming request.
    expect(notifier.push).toHaveBeenCalledTimes(1);
    expect(notifier.push.mock.calls[0][0]).toMatchObject({ type: 'FRIEND_REQUEST', userId: 'receiver-1' });
  });

  it('blocks duplicate pending requests in either direction', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: 'receiver-1' } as never);
    mockedPrisma.friendship.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.friendRequest.findMany.mockResolvedValueOnce([{ id: 'request-1', status: 'pending' }] as never);

    await expect(service.sendFriendRequest('sender-1', 'receiver-1')).rejects.toThrow('Đã có lời mời kết bạn đang chờ');
    expect(mockedPrisma.friendRequest.create).not.toHaveBeenCalled();
  });

  it('accepts a request and creates friendship once', async () => {
    mockedPrisma.friendRequest.findFirst.mockResolvedValueOnce({
      id: 'request-1',
      senderId: 'sender-1',
      receiverId: 'receiver-1',
      status: 'pending',
    } as never);
    mockedPrisma.friendship.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.friendship.create.mockResolvedValueOnce({ id: 'friendship-1' } as never);
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ fullName: 'Bob' } as never);
    mockedPrisma.friendRequest.update.mockResolvedValueOnce({
      id: 'request-1',
      status: 'accepted',
    } as never);

    const result = await service.respondFriendRequest('receiver-1', 'request-1', 'accepted');

    expect(mockedPrisma.friendship.create).toHaveBeenCalledWith({
      data: { userAId: 'sender-1', userBId: 'receiver-1' },
    });
    expect(result).toEqual({ id: 'request-1', status: 'accepted' });
    // Sender is notified that their request was accepted.
    expect(notifier.push).toHaveBeenCalledTimes(1);
    expect(notifier.push.mock.calls[0][0]).toMatchObject({ type: 'FRIEND_ACCEPT', userId: 'sender-1' });
  });

  it('only lets the sender cancel pending sent requests', async () => {
    mockedPrisma.friendRequest.findFirst.mockResolvedValueOnce(null);

    await expect(service.cancelFriendRequest('sender-1', 'request-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(mockedPrisma.friendRequest.delete).not.toHaveBeenCalled();
  });

  it('excludes self, friends, and pending requests from suggestions', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', major: 'SE', cohort: 'K15' } as never);
    mockedPrisma.friendship.findMany.mockResolvedValueOnce([
      {
        id: 'friendship-1',
        userAId: 'user-1',
        userBId: 'friend-1',
        userA: { id: 'user-1' },
        userB: { id: 'friend-1' },
      },
    ] as never);
    mockedPrisma.friendRequest.findMany.mockResolvedValueOnce([
      { senderId: 'user-1', receiverId: 'pending-1' },
      { senderId: 'pending-2', receiverId: 'user-1' },
    ] as never);
    mockedPrisma.user.findMany.mockResolvedValueOnce([{ id: 'suggested-1' }] as never);

    await service.getFriendSuggestions('user-1');

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
      where: {
        id: { notIn: ['user-1', 'friend-1', 'pending-1', 'pending-2'] },
        OR: [{ major: 'SE' }, { cohort: 'K15' }],
      },
      take: 8,
      select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true },
    });
  });

  it('falls back to broad suggestions when profile matches are empty', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', major: 'SE', cohort: 'K15' } as never);
    mockedPrisma.friendship.findMany.mockResolvedValueOnce([] as never);
    mockedPrisma.friendRequest.findMany.mockResolvedValueOnce([] as never);
    mockedPrisma.user.findMany.mockResolvedValueOnce([] as never);
    mockedPrisma.user.findMany.mockResolvedValueOnce([{ id: 'suggested-1' }] as never);

    await service.getFriendSuggestions('user-1');

    expect(mockedPrisma.user.findMany).toHaveBeenLastCalledWith({
      where: { id: { notIn: ['user-1'] } },
      take: 8,
      select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true },
    });
  });

  it('searches users by name, email, student id, department, and major', async () => {
    mockedPrisma.friendship.findMany.mockResolvedValueOnce([] as never);
    mockedPrisma.friendRequest.findMany.mockResolvedValueOnce([] as never);
    mockedPrisma.user.findMany.mockResolvedValueOnce([{ id: 'result-1', fullName: 'Nguyen Van A' }] as never);

    await service.searchUsers('user-1', 'nguyen');

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
      where: {
        id: { notIn: ['user-1'] },
        OR: [
          { fullName: { contains: 'nguyen', mode: 'insensitive' } },
          { email: { contains: 'nguyen', mode: 'insensitive' } },
          { studentId: { contains: 'nguyen', mode: 'insensitive' } },
          { department: { contains: 'nguyen', mode: 'insensitive' } },
          { major: { contains: 'nguyen', mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true },
    });
  });
});

describe('UsersService portfolio', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(notifier as never);
  });

  it('aggregates all portfolio sections in one call', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1' } as never);
    mockedPrisma.userSkill.findMany.mockResolvedValueOnce([{ id: 's1', skill: 'React' }] as never);
    mockedPrisma.userAchievement.findMany.mockResolvedValueOnce([] as never);
    mockedPrisma.userCertificate.findMany.mockResolvedValueOnce([] as never);
    mockedPrisma.userProject.findMany.mockResolvedValueOnce([{ id: 'p1', title: 'CampusConnect' }] as never);

    const result = await service.getPortfolio('user-1');

    expect(result.skills).toHaveLength(1);
    expect(result.projects[0].title).toBe('CampusConnect');
    expect(result.achievements).toEqual([]);
  });

  it('rejects portfolio fetch for a missing user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.getPortfolio('ghost')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('adds a skill and rejects blank names', async () => {
    mockedPrisma.userSkill.create.mockResolvedValueOnce({ id: 's1', skill: 'Node' } as never);
    await expect(service.addSkill('user-1', 'Node')).resolves.toMatchObject({ skill: 'Node' });
    await expect(service.addSkill('user-1', '   ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps a unique-constraint violation to Conflict', async () => {
    mockedPrisma.userSkill.create.mockRejectedValueOnce(new Error('unique'));
    await expect(service.addSkill('user-1', 'React')).rejects.toBeInstanceOf(ConflictException);
  });

  it('forbids deleting another user\'s skill', async () => {
    mockedPrisma.userSkill.findUnique.mockResolvedValueOnce({ id: 's1', userId: 'other' } as never);
    await expect(service.removeSkill('user-1', 's1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockedPrisma.userSkill.delete).not.toHaveBeenCalled();
  });

  it('deletes an owned skill', async () => {
    mockedPrisma.userSkill.findUnique.mockResolvedValueOnce({ id: 's1', userId: 'user-1' } as never);
    mockedPrisma.userSkill.delete.mockResolvedValueOnce({ id: 's1' } as never);
    await service.removeSkill('user-1', 's1');
    expect(mockedPrisma.userSkill.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it('validates certificate required fields and date', async () => {
    await expect(
      service.addCertificate('user-1', { name: '', issuer: 'AWS', issuedAt: '2025-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.addCertificate('user-1', { name: 'CCP', issuer: 'AWS', issuedAt: 'not-a-date' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a project with a normalized techStack', async () => {
    mockedPrisma.userProject.create.mockResolvedValueOnce({ id: 'p1' } as never);
    await service.addProject('user-1', { title: 'App', techStack: undefined });
    expect(mockedPrisma.userProject.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ techStack: [] }) }),
    );
  });

  it('forbids deleting another user\'s project', async () => {
    mockedPrisma.userProject.findUnique.mockResolvedValueOnce({ id: 'p1', userId: 'other' } as never);
    await expect(service.removeProject('user-1', 'p1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});

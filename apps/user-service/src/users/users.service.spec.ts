import { NotFoundException } from '@nestjs/common';
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
  },
}));

const mockedPrisma = prisma as any;

describe('UsersService friendship', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService();
  });

  it('creates a pending friend request when users are not connected', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: 'receiver-1' } as never);
    mockedPrisma.friendship.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.friendRequest.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.friendRequest.create.mockResolvedValueOnce({
      id: 'request-1',
      senderId: 'sender-1',
      receiverId: 'receiver-1',
      status: 'pending',
    } as never);

    const result = await service.sendFriendRequest('sender-1', 'receiver-1');

    expect(mockedPrisma.friendRequest.create).toHaveBeenCalledWith({
      data: { senderId: 'sender-1', receiverId: 'receiver-1', status: 'pending' },
      include: {
        receiver: { select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true } },
      },
    });
    expect(result).toEqual({
      id: 'request-1',
      senderId: 'sender-1',
      receiverId: 'receiver-1',
      status: 'pending',
    });
  });

  it('blocks duplicate pending requests in either direction', async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce({ id: 'receiver-1' } as never);
    mockedPrisma.friendship.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.friendRequest.findFirst.mockResolvedValueOnce({ id: 'request-1' } as never);

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
    mockedPrisma.friendRequest.update.mockResolvedValueOnce({
      id: 'request-1',
      status: 'accepted',
    } as never);

    const result = await service.respondFriendRequest('receiver-1', 'request-1', 'accepted');

    expect(mockedPrisma.friendship.create).toHaveBeenCalledWith({
      data: { userAId: 'sender-1', userBId: 'receiver-1' },
    });
    expect(mockedPrisma.friendRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { status: 'accepted' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true, major: true, cohort: true } },
      },
    });
    expect(result).toEqual({ id: 'request-1', status: 'accepted' });
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

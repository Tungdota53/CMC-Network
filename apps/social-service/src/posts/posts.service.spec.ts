import { PostsService } from './posts.service';
import { prisma } from '@campus-connect/database';

jest.mock('@campus-connect/database', () => {
  const mockPrisma = {
    $transaction: jest
      .fn()
      .mockImplementation((args) =>
        Array.isArray(args) ? Promise.all(args) : args(mockPrisma),
      ),
    post: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    postLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    comment: { create: jest.fn() },
    notification: { create: jest.fn() },
    user: { findUnique: jest.fn() },
    storyView: { upsert: jest.fn() },
  };
  return {
    PostType: { TEXT: 'TEXT', IMAGE: 'IMAGE', STORY: 'STORY' },
    prisma: mockPrisma,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const notifier = { push: jest.fn().mockResolvedValue(undefined) };

describe('PostsService — create & like', () => {
  let service: PostsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(notifier as never);
  });

  it('creates a post with the given author id (no firstUser fallback)', async () => {
    jest
      .mocked(prisma.post.create)
      .mockResolvedValue({ id: 'p1', userId: 'user-1' } as never);
    await service.createPost('user-1', 'hello', []);
    const call = jest.mocked(prisma.post.create).mock.calls[0][0] as {
      data: { userId: string };
    };
    expect(call.data.userId).toBe('user-1');
  });

  it('notifies the post owner on a new like, but not on self-like', async () => {
    jest.mocked(prisma.postLike.findUnique).mockResolvedValue(null);
    jest.mocked(prisma.postLike.create).mockResolvedValue({} as never);
    jest.mocked(prisma.post.update).mockResolvedValue({ id: 'p1' } as never);
    jest
      .mocked(prisma.post.findUnique)
      .mockResolvedValue({ userId: 'owner' } as never);
    jest
      .mocked(prisma.user.findUnique)
      .mockResolvedValue({ fullName: 'Liker' } as never);

    await service.likePost('p1', 'liker', 'LIKE');
    expect(notifier.push).toHaveBeenCalledTimes(1);

    notifier.push.mockClear();
    jest
      .mocked(prisma.post.findUnique)
      .mockResolvedValue({ userId: 'self' } as never);
    await service.likePost('p1', 'self', 'LIKE');
    expect(notifier.push).not.toHaveBeenCalled();
  });
});

describe('PostsService — stories 24h expiry', () => {
  let service: PostsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(notifier as never);
  });

  it('queries only stories newer than the 24h cutoff', async () => {
    jest.mocked(prisma.post.findMany).mockResolvedValue([] as never);
    jest.mocked(prisma.post.deleteMany).mockResolvedValue({ count: 0 });

    await service.getStories('viewer');

    const where = (
      jest.mocked(prisma.post.findMany).mock.calls[0][0] as {
        where: { createdAt: { gte: Date } };
      }
    ).where;
    expect(where.createdAt.gte).toBeInstanceOf(Date);
    expect(where.createdAt.gte.getTime()).toBeLessThan(Date.now());
  });
});

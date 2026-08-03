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
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    postLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    commentLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    notification: { create: jest.fn() },
    user: { findUnique: jest.fn() },
    storyView: { upsert: jest.fn() },
  };
  return {
    PostType: { TEXT: 'TEXT', IMAGE: 'IMAGE', STORY: 'STORY' },
    PostVisibility: {
      PUBLIC: 'PUBLIC',
      FRIENDS: 'FRIENDS',
      PRIVATE: 'PRIVATE',
    },
    prisma: mockPrisma,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

const notifier = { push: jest.fn().mockResolvedValue(undefined) };
const cache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('PostsService — create & like', () => {
  let service: PostsService;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(prisma.post.findMany).mockResolvedValue([] as never);
    service = new PostsService(notifier as never, cache as never);
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

  it('normalizes whitespace before storing post content', async () => {
    jest.mocked(prisma.post.create).mockResolvedValue({ id: 'p1' } as never);

    await service.createPost('user-1', '  Xin   chào\n\nCMC  ', []);

    const call = jest.mocked(prisma.post.create).mock.calls[0][0] as {
      data: { content: string };
    };
    expect(call.data.content).toBe('Xin chào\nCMC');
  });

  it('rejects duplicate content posted by the same user within ten minutes', async () => {
    jest
      .mocked(prisma.post.findMany)
      .mockResolvedValue([{ content: 'Xin chào CMC', mediaUrls: [] }] as never);

    await expect(
      service.createPost('user-1', '  xin  CHÀO cmc ', []),
    ).rejects.toThrow('Nội dung này đã được đăng gần đây');
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it('rejects excessive content, links, and media URLs', async () => {
    await expect(
      service.createPost('user-1', 'a'.repeat(10_001), []),
    ).rejects.toThrow('Nội dung bài viết không được vượt quá 10000 ký tự');
    await expect(
      service.createPost(
        'user-1',
        'https://a.vn https://b.vn https://c.vn https://d.vn https://e.vn https://f.vn',
        [],
      ),
    ).rejects.toThrow('Bài viết không được chứa quá 5 liên kết');
    await expect(
      service.createPost(
        'user-1',
        '',
        Array.from({ length: 11 }, (_, i) => `/${i}`),
      ),
    ).rejects.toThrow('Bài viết không được có quá 10 tệp đính kèm');
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

describe('PostsService — visibility policy', () => {
  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(notifier as never, cache as never);
  });

  it('limits anonymous feed readers to PUBLIC posts', async () => {
    jest.mocked(prisma.post.findMany).mockResolvedValue([] as never);

    await service.getLatestFeed(1, 10);

    expect(jest.mocked(prisma.post.findMany).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: expect.objectContaining({ visibility: 'PUBLIC' }),
      }),
    );
  });

  it('allows authenticated viewers to see own, public, and friends-only posts from friends', async () => {
    jest.mocked(prisma.post.findMany).mockResolvedValue([] as never);

    await service.getLatestFeed(1, 10, 'viewer-1');

    const query = jest.mocked(prisma.post.findMany).mock.calls[0][0] as {
      where: { OR: unknown[] };
    };
    expect(query.where.OR).toEqual([
      { visibility: 'PUBLIC' },
      { userId: 'viewer-1' },
      {
        visibility: 'FRIENDS',
        user: {
          OR: [
            { friendships: { some: { userBId: 'viewer-1' } } },
            { friendships2: { some: { userAId: 'viewer-1' } } },
          ],
        },
      },
    ]);
  });

  it('applies the same visibility policy to post detail', async () => {
    jest.mocked(prisma.post.findFirst).mockResolvedValue(null);

    await expect(service.getPostById('private-post')).rejects.toThrow(
      'Không tìm thấy bài viết',
    );

    expect(jest.mocked(prisma.post.findFirst).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: expect.objectContaining({ visibility: 'PUBLIC' }),
      }),
    );
  });

  it('does not return comments before confirming post visibility', async () => {
    jest.mocked(prisma.post.findFirst).mockResolvedValue(null);

    await expect(service.getComments('private-post')).rejects.toThrow(
      'Không tìm thấy bài viết',
    );
    expect(prisma.comment.findMany).not.toHaveBeenCalled();
  });
});

describe('PostsService — comment rules', () => {
  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(notifier as never, cache as never);
  });

  it('rejects new comments when the post owner locked comments', async () => {
    jest
      .mocked(prisma.post.findFirst)
      .mockResolvedValue({ id: 'post-1' } as never);
    jest.mocked(prisma.post.findUnique).mockResolvedValue({
      id: 'post-1',
      userId: 'owner',
      commentLocked: true,
    } as never);

    await expect(
      service.commentPost('post-1', 'viewer', 'Không thể gửi'),
    ).rejects.toThrow('Bình luận đã bị khóa');
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it('stores a reply under a parent comment from the same post', async () => {
    jest
      .mocked(prisma.post.findFirst)
      .mockResolvedValue({ id: 'post-1' } as never);
    jest.mocked(prisma.post.findUnique).mockResolvedValue({
      id: 'post-1',
      userId: 'owner',
      commentLocked: false,
    } as never);
    jest.mocked(prisma.comment.findFirst).mockResolvedValue({
      id: 'comment-1',
      postId: 'post-1',
    } as never);
    jest.mocked(prisma.comment.create).mockResolvedValue({
      id: 'reply-1',
      user: { fullName: 'Viewer' },
    } as never);
    jest.mocked(prisma.post.update).mockResolvedValue({} as never);

    await service.commentPost('post-1', 'viewer', 'Phản hồi', 'comment-1');

    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentId: 'comment-1' }),
      }),
    );
  });

  it('rejects a parent comment that belongs to another post', async () => {
    jest
      .mocked(prisma.post.findFirst)
      .mockResolvedValue({ id: 'post-1' } as never);
    jest.mocked(prisma.post.findUnique).mockResolvedValue({
      id: 'post-1',
      userId: 'owner',
      commentLocked: false,
    } as never);
    jest.mocked(prisma.comment.findFirst).mockResolvedValue(null);

    await expect(
      service.commentPost('post-1', 'viewer', 'Sai luồng', 'foreign-comment'),
    ).rejects.toThrow('Bình luận cha không hợp lệ');
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
});

describe('PostsService — atomic reactions', () => {
  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(notifier as never, cache as never);
  });

  it('creates a reaction transactionally and increments only once', async () => {
    jest
      .mocked(prisma.post.findUnique)
      .mockResolvedValueOnce({ id: 'post-1', userId: 'owner' } as never)
      .mockResolvedValueOnce({ id: 'post-1', likes: 1, likesRel: [] } as never);
    jest.mocked(prisma.postLike.findUnique).mockResolvedValue(null);
    jest.mocked(prisma.postLike.create).mockResolvedValue({} as never);
    jest.mocked(prisma.post.update).mockResolvedValue({} as never);

    await service.setReaction('post-1', 'viewer', 'LOVE');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.postLike.create).toHaveBeenCalled();
  });

  it('removes a reaction and decrements only when a row was deleted', async () => {
    jest.mocked(prisma.postLike.deleteMany).mockResolvedValue({ count: 1 });
    jest.mocked(prisma.post.updateMany).mockResolvedValue({ count: 1 });
    jest.mocked(prisma.post.findUnique).mockResolvedValue({
      id: 'post-1',
      likes: 0,
      likesRel: [],
    } as never);

    await service.removeReaction('post-1', 'viewer');

    expect(prisma.postLike.deleteMany).toHaveBeenCalledWith({
      where: { postId: 'post-1', userId: 'viewer' },
    });
    expect(prisma.post.updateMany).toHaveBeenCalledWith({
      where: { id: 'post-1', likes: { gt: 0 } },
      data: { likes: { decrement: 1 } },
    });
  });
});

describe('PostsService — atomic comment likes', () => {
  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(notifier as never, cache as never);
  });

  it('creates a comment like and increments within one transaction', async () => {
    jest
      .mocked(prisma.comment.findUnique)
      .mockResolvedValue({ id: 'comment-1' } as never);
    jest.mocked(prisma.commentLike.findUnique).mockResolvedValue(null);
    jest.mocked(prisma.commentLike.create).mockResolvedValue({} as never);
    jest.mocked(prisma.comment.update).mockResolvedValue({} as never);

    await expect(
      service.toggleCommentLike('comment-1', 'user-1'),
    ).resolves.toEqual({ liked: true });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('decrements only when unlike deletes a relation', async () => {
    jest.mocked(prisma.commentLike.deleteMany).mockResolvedValue({ count: 0 });

    await expect(service.unlikeComment('comment-1', 'user-1')).resolves.toEqual(
      { liked: false },
    );
    expect(prisma.comment.updateMany).not.toHaveBeenCalled();
  });
});

describe('PostsService — stories 24h expiry', () => {
  let service: PostsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(notifier as never, cache as never);
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

describe('PostsService — admin listing security', () => {
  let service: PostsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(notifier as never, cache as never);
  });

  it('returns a bounded page and allowlists author fields', async () => {
    jest.mocked(prisma.post.findMany).mockResolvedValue([] as never);
    jest.mocked(prisma.post.count).mockResolvedValue(23);

    const result = await service.getAllPostsAdmin({ page: 2, limit: 10 });

    const query = jest.mocked(prisma.post.findMany).mock.calls[0][0] as {
      skip: number;
      take: number;
      include: { user: { select: Record<string, boolean> } };
    };
    expect(query.skip).toBe(10);
    expect(query.take).toBe(10);
    expect(query.include.user.select).toEqual({
      id: true,
      fullName: true,
      avatarUrl: true,
    });
    expect(query.include.user.select).not.toHaveProperty('passwordHash');
    expect(query.include.user.select).not.toHaveProperty('otpCode');
    expect(query.include.user.select).not.toHaveProperty('twoFactorSecret');
    expect(result).toEqual({
      data: [],
      meta: { page: 2, limit: 10, total: 23, totalPages: 3 },
    });
  });
});

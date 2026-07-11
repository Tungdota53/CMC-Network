import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PostType, prisma } from '@campus-connect/database';
import {
  NotificationDispatcher,
  createStorageProvider,
  validateUpload,
  CacheService,
  type StorageProvider,
} from '@campus-connect/common';
import { join } from 'path';

type UploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class PostsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PostsService');
  private readonly storage: StorageProvider = createStorageProvider(
    join(process.cwd(), 'uploads'),
    '/uploads',
  );
  /** Handle for the background story-purge timer. */
  private purgeTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly notifier: NotificationDispatcher,
    private readonly cache: CacheService,
  ) {}

  /** Run the expired-story purge on a fixed interval instead of per-request. */
  onModuleInit() {
    const runPurge = () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.purgeExpiredStories(cutoff).catch((err) =>
        this.logger.warn(
          `purgeExpiredStories failed: ${(err as Error)?.message ?? err}`,
        ),
      );
    };
    // Purge every 15 minutes; unref so it never keeps the process alive.
    this.purgeTimer = setInterval(runPurge, 15 * 60 * 1000);
    this.purgeTimer.unref?.();
    runPurge();
  }

  onModuleDestroy() {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
  }

  async uploadImage(file: UploadFile) {
    validateUpload(
      {
        mimetype: file.mimetype,
        size: file.size ?? file.buffer.length,
        originalname: file.originalname,
      },
      { preset: 'image+video', maxSizeBytes: 25 * 1024 * 1024 },
    );

    const stored = await this.storage.put({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size ?? file.buffer.length,
      folder: 'posts',
    });

    return { url: stored.url };
  }

  /**
   * Lightweight author projection — never leak password hash / email / 2FA
   * secret through the feed, and keep the payload small.
   */
  private static readonly authorSelect = {
    id: true,
    fullName: true,
    avatarUrl: true,
    major: true,
    cohort: true,
  } as const;

  /**
   * Build the include clause for a post. `likesRel` is scoped to the viewer
   * only (so the client can tell if the viewer liked it) — NOT all likes,
   * which would be unbounded and blow up memory on hot posts.
   */
  private postInclude(viewerId?: string) {
    return {
      user: { select: PostsService.authorSelect },
      likesRel: viewerId
        ? { where: { userId: viewerId }, select: { userId: true, type: true } }
        : ({
            where: { userId: '00000000-0000-0000-0000-000000000000' },
            select: { userId: true, type: true },
          } as const),
      comments: {
        take: 3,
        orderBy: { createdAt: 'desc' as const },
        include: { user: { select: PostsService.authorSelect } },
      },
      _count: { select: { comments: true } },
    };
  }

  async getFeed(page = 1, limit = 10, viewerId?: string) {
    // Cache the computed page briefly to absorb hot-feed traffic. Keyed by
    // viewer (likes are viewer-scoped) + page + limit. 30s TTL keeps it fresh.
    const cacheKey = `feed:${viewerId ?? 'anon'}:${page}:${limit}`;
    return this.cache.getOrSet(cacheKey, 30, () =>
      this.computeFeed(page, limit, viewerId),
    );
  }

  private async computeFeed(page: number, limit: number, viewerId?: string) {
    const skip = (page - 1) * limit;

    // Fetch a bounded pool of recent candidates for scoring. Payload is trimmed
    // (viewer-scoped likes + selected author fields) so 200 rows stay cheap.
    const candidates = await prisma.post.findMany({
      where: { type: { not: PostType.STORY }, deletedAt: null },
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: this.postInclude(viewerId),
    });

    const now = Date.now();

    const scoredPosts = candidates.map((post) => {
      const engagementScore =
        post.likes * 2 +
        post.commentCount * 3 +
        post.shareCount * 4 +
        post.saveCount * 2;
      const hoursOld = (now - post.createdAt.getTime()) / (1000 * 60 * 60);
      const timeDecay = Math.max(0, hoursOld * 1.5);
      const score = engagementScore - timeDecay;
      return { ...post, score };
    });

    scoredPosts.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.1) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return b.score - a.score;
    });

    return scoredPosts.slice(skip, skip + limit);
  }

  async getUserPosts(userId: string, page = 1, limit = 20, viewerId?: string) {
    const skip = (page - 1) * limit;
    return prisma.post.findMany({
      where: { userId, type: { not: PostType.STORY }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Math.min(limit, 50),
      include: this.postInclude(viewerId ?? userId),
    });
  }

  /** Stories visible for 24h only; expired ones are filtered out and lazily purged. */
  async getStories(viewerId?: string) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await prisma.post.findMany({
      where: {
        type: PostType.STORY,
        mediaUrls: { isEmpty: false },
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: PostsService.authorSelect },
        // Only join the viewer's own seen-row when we know who is viewing.
        ...(viewerId ? { storySeenBy: { where: { userId: viewerId } } } : {}),
        _count: { select: { storySeenBy: true } },
      },
    });

    // Expired stories are hard-deleted by the background interval in
    // onModuleInit — no per-request purge to keep the read path fast.

    return stories.map((story) => {
      const seen = (story as { storySeenBy?: { userId: string }[] })
        .storySeenBy;
      return {
        ...story,
        expiresAt: new Date(story.createdAt.getTime() + 24 * 60 * 60 * 1000),
        seenCount: story._count?.storySeenBy ?? 0,
        seenByMe: Array.isArray(seen) ? seen.length > 0 : false,
      };
    });
  }

  /** Hard-delete stories past their 24h window. */
  private async purgeExpiredStories(cutoff: Date) {
    await prisma.post.deleteMany({
      where: { type: PostType.STORY, createdAt: { lt: cutoff } },
    });
  }

  /** Mark a story as seen by a viewer (idempotent). */
  async markStorySeen(storyId: string, userId: string) {
    const story = await prisma.post.findUnique({
      where: { id: storyId },
      select: { id: true, type: true },
    });
    if (!story || story.type !== PostType.STORY) {
      throw new NotFoundException('Không tìm thấy story');
    }
    await prisma.storyView.upsert({
      where: { storyId_userId: { storyId, userId } },
      update: {},
      create: { storyId, userId },
    });
    return { success: true };
  }

  async createStory(userId: string, mediaUrl: string, content = '') {
    return this.createPost(
      userId,
      content || 'Story',
      [mediaUrl],
      PostType.STORY,
    );
  }

  async createPost(
    userId: string,
    content: string,
    mediaUrls: string[] = [],
    typeOverride?: PostType,
  ) {
    return prisma.post.create({
      data: {
        userId,
        type:
          typeOverride || (mediaUrls.length ? PostType.IMAGE : PostType.TEXT),
        content,
        mediaUrls,
      },
      include: {
        user: { select: PostsService.authorSelect },
        likesRel: true,
        comments: {
          include: { user: { select: PostsService.authorSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async likePost(postId: string, userId: string, type: string) {
    const existingLike = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingLike) {
      if (existingLike.type === type) {
        await prisma.postLike.delete({ where: { id: existingLike.id } });
        return prisma.post.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
          include: { likesRel: true },
        });
      }

      await prisma.postLike.update({
        where: { id: existingLike.id },
        data: { type },
      });
      return prisma.post.findUnique({
        where: { id: postId },
        include: { likesRel: true },
      });
    }

    await prisma.postLike.create({
      data: { postId, userId, type },
    });
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { likes: { increment: 1 } },
      include: { likesRel: true },
    });

    // Notify the post owner (skip self-likes).
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });
    if (post && post.userId !== userId) {
      const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      });
      await this.notify(
        post.userId,
        'LIKE',
        `${actor?.fullName ?? 'Ai đó'} đã thích bài viết của bạn`,
        postId,
      );
    }

    return updatedPost;
  }

  /** Persist + push a realtime notification; never throws into the caller. */
  private async notify(
    userId: string,
    type: string,
    content: string,
    relatedId?: string,
  ) {
    try {
      await prisma.notification.create({
        data: { userId, type: type as never, content, relatedId },
      });
    } catch {
      // ignore persistence errors
    }
    try {
      await this.notifier.push({
        userId,
        type: type as never,
        content,
        relatedId,
      });
    } catch {
      // ignore push errors (e.g., chat-service is down) so they don't break the caller
    }
  }

  async editPost(postId: string, userId: string, content: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.userId !== userId)
      throw new ForbiddenException('Không có quyền chỉnh sửa bài viết này');

    return prisma.post.update({
      where: { id: postId },
      data: { content },
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.userId !== userId)
      throw new ForbiddenException('Không có quyền xóa bài viết này');

    return prisma.post.delete({ where: { id: postId } });
  }

  async commentPost(postId: string, userId: string, content: string) {
    if (!content.trim())
      throw new BadRequestException('Nội dung bình luận không được để trống');

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    const comment = await prisma.comment.create({
      data: { postId, userId, content },
      include: {
        user: { select: PostsService.authorSelect },
      },
    });

    // Notify the post owner (skip self-comments).
    if (post.userId !== userId) {
      await this.notify(
        post.userId,
        'COMMENT',
        `${comment.user.fullName} đã bình luận bài viết của bạn`,
        postId,
      );
    }

    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  /** Toggle save/bookmark a post for a user. Returns { saved }. */
  async toggleSave(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    try {
      await prisma.$transaction([
        prisma.postSave.create({ data: { postId, userId } }),
        prisma.post.update({
          where: { id: postId },
          data: { saveCount: { increment: 1 } },
        }),
      ]);
      return { saved: true };
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Lost the race, it's already saved, so delete it instead
        await prisma.$transaction([
          prisma.postSave.delete({
            where: { postId_userId: { postId, userId } },
          }),
          prisma.post.update({
            where: { id: postId },
            data: { saveCount: { decrement: 1 } },
          }),
        ]);

        // Defensive: ensure saveCount never drops below 0
        await prisma.post.updateMany({
          where: { id: postId, saveCount: { lt: 0 } },
          data: { saveCount: 0 },
        });

        return { saved: false };
      }
      throw err;
    }
  }

  /** Posts a user has saved/bookmarked. */
  async getSavedPosts(userId: string) {
    const saves = await prisma.postSave.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            user: { select: PostsService.authorSelect },
            _count: { select: { comments: true } },
          },
        },
      },
    });
    return saves.map((s) => s.post);
  }

  /** Toggle like on a comment. Returns { liked }. */
  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      await prisma.comment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } },
      });
      return { liked: false };
    }

    await prisma.commentLike.create({ data: { commentId, userId } });
    await prisma.comment.update({
      where: { id: commentId },
      data: { likes: { increment: 1 } },
    });
    return { liked: true };
  }

  /** Share a post: creates a new post referencing the original. */
  async sharePost(postId: string, userId: string, content = '') {
    const original = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, type: true, sharedFromId: true },
    });
    if (!original) throw new NotFoundException('Không tìm thấy bài viết');

    // Resolve to the root post when sharing a share — avoids share-of-share chains.
    const rootPostId =
      original.type === PostType.SHARE && original.sharedFromId
        ? original.sharedFromId
        : original.id;

    const shared = await prisma.post.create({
      data: {
        userId,
        type: PostType.SHARE,
        content,
        sharedFromId: rootPostId,
      },
      include: {
        user: true,
        sharedFrom: {
          include: { user: true },
        },
      },
    });

    await prisma.post.update({
      where: { id: rootPostId },
      data: { shareCount: { increment: 1 } },
    });

    // Notify the root post's owner (look it up — `original` may have been a share itself).
    const rootPost =
      rootPostId === original.id
        ? original
        : await prisma.post.findUnique({
            where: { id: rootPostId },
            select: { userId: true },
          });
    if (rootPost && rootPost.userId !== userId) {
      await this.notify(
        rootPost.userId,
        'SYSTEM',
        'Bài viết của bạn vừa được chia sẻ',
        rootPostId,
      );
    }

    return shared;
  }

  async getAllPostsAdmin() {
    return prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  async adminDeletePost(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    return prisma.post.delete({ where: { id: postId } });
  }
}

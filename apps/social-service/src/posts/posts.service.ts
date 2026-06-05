import { Injectable, NotFoundException } from '@nestjs/common';
import { PostType, prisma } from '@campus-connect/database';
import { promises as fs } from 'fs';
import { join } from 'path';

type UploadFile = {
  buffer: Buffer;
  originalname: string;
};

@Injectable()
export class PostsService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'posts');

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {}
  }

  async uploadImage(file: UploadFile) {
    const ext = file.originalname.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = join(this.uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return { url: `/uploads/posts/${fileName}` };
  }

  async getFeed(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return prisma.post.findMany({
      where: { type: { not: PostType.STORY } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, department: true } },
        likesRel: { select: { userId: true, type: true } },
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  async getStories() {
    return prisma.post.findMany({
      where: { type: PostType.STORY, mediaUrls: { isEmpty: false } },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async createStory(userId: string, mediaUrl: string, content = '') {
    return this.createPost(userId, content || 'Story', [mediaUrl], PostType.STORY);
  }

  async createPost(userId: string, content: string, mediaUrls: string[] = [], typeOverride?: PostType) {
    let authorId = userId;
    if (!authorId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) authorId = firstUser.id;
    }
    return prisma.post.create({
      data: {
        userId: authorId,
        type: typeOverride || (mediaUrls.length ? PostType.IMAGE : PostType.TEXT),
        content,
        mediaUrls,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async likePost(postId: string, userId: string, type: string) {
    let authorId = userId;
    if (!authorId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) authorId = firstUser.id;
    }

    const existingLike = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: authorId } },
    });

    if (existingLike) {
      if (existingLike.type === type) {
        await prisma.postLike.delete({ where: { id: existingLike.id } });
        return prisma.post.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
          include: { likesRel: { select: { userId: true, type: true } } },
        });
      }

      await prisma.postLike.update({
        where: { id: existingLike.id },
        data: { type },
      });
      return prisma.post.findUnique({
        where: { id: postId },
        include: { likesRel: { select: { userId: true, type: true } } },
      });
    }

    await prisma.postLike.create({
      data: { postId, userId: authorId, type },
    });
    return prisma.post.update({
      where: { id: postId },
      data: { likes: { increment: 1 } },
      include: { likesRel: { select: { userId: true, type: true } } },
    });
  }

  async editPost(postId: string, userId: string, content: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.userId !== userId) throw new Error('Không có quyền chỉnh sửa bài viết này');

    return prisma.post.update({
      where: { id: postId },
      data: { content },
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.userId !== userId) throw new Error('Không có quyền xóa bài viết này');

    return prisma.post.delete({ where: { id: postId } });
  }

  async commentPost(postId: string, userId: string, content: string) {
    if (!content.trim()) throw new Error('Nội dung bình luận không được để trống');

    let authorId = userId;
    if (!authorId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) authorId = firstUser.id;
    }

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    const comment = await prisma.comment.create({
      data: { postId, userId: authorId, content },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  async getAllPostsAdmin() {
    return prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    });
  }

  async adminDeletePost(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    return prisma.post.delete({ where: { id: postId } });
  }
}

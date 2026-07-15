import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  VerifiedUserGuard,
  resolveUserId,
} from '@campus-connect/common';
import { PostType } from '@prisma/client';
import 'multer';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllPostsAdmin() {
    return this.postsService.getAllPostsAdmin();
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async adminDeletePost(@Param('id') id: string) {
    return this.postsService.adminDeletePost(id);
  }

  @Get('feed/latest')
  async getLatestFeed(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser('sub') viewerId?: string,
  ) {
    return this.postsService.getLatestFeed(
      Number(page) || 1,
      Number(limit) || 10,
      viewerId,
    );
  }

  @Get('feed')
  async getFeed(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser('sub') viewerId?: string,
  ) {
    return this.postsService.getFeed(
      Number(page) || 1,
      Number(limit) || 10,
      viewerId,
    );
  }

  @Get('stories')
  async getStories(@CurrentUser('sub') viewerId?: string) {
    return this.postsService.getStories(viewerId);
  }

  @Get('saved/:userId')
  async getSavedPosts(@Param('userId') userId: string) {
    return this.postsService.getSavedPosts(userId);
  }

  @Get('user/:userId')
  async getUserPosts(
    @Param('userId') userId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser('sub') viewerId?: string,
  ) {
    return this.postsService.getUserPosts(
      userId,
      Number(page) || 1,
      Number(limit) || 20,
      viewerId,
    );
  }

  @Get('club/:clubId')
  async getClubPosts(
    @Param('clubId') clubId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser('sub') viewerId?: string,
  ) {
    return this.postsService.getClubPosts(
      clubId,
      Number(page) || 1,
      Number(limit) || 20,
      viewerId,
    );
  }

  @Get(':id')
  async getPostById(
    @Param('id') id: string,
    @CurrentUser('sub') viewerId?: string,
  ) {
    return this.postsService.getPostById(id, viewerId);
  }

  @Post(':id/hide')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async hidePost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.hidePost(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Delete(':id/hide')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async unhidePost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.unhidePost(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Post(['stories/:id/seen', 'stories/:id/view'])
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async markStorySeen(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.markStorySeen(
      id,
      resolveUserId(tokenUserId, data.userId),
    );
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.postsService.uploadImage(file);
  }

  @Post('stories')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async createStory(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; mediaUrl?: string; content?: string } = {},
  ) {
    return this.postsService.createStory(
      resolveUserId(tokenUserId, data.userId),
      data.mediaUrl || '',
      data.content,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async createPost(
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    data: {
      userId?: string;
      content?: string;
      mediaUrls?: string[] | string;
      type?: string;
      poll?: unknown;
      clubId?: string;
    } = {},
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const uploadedUrls = files?.length
      ? await Promise.all(
          files.map((file) => this.postsService.uploadImage(file)),
        )
      : [];
    const mediaUrls = [
      ...(Array.isArray(data.mediaUrls)
        ? data.mediaUrls
        : data.mediaUrls
          ? [data.mediaUrls]
          : []),
      ...uploadedUrls.map((item) => item.url),
    ];

    let parsedPoll = null;
    if (data.poll) {
      try {
        parsedPoll =
          typeof data.poll === 'string' ? JSON.parse(data.poll) : data.poll;
      } catch {
        // ignore
      }
    }

    return this.postsService.createPost(
      resolveUserId(tokenUserId, data.userId),
      data.content || '',
      mediaUrls,
      this.parsePostType(data.type),
      parsedPoll,
      data.clubId,
    );
  }

  private parsePostType(type?: string): PostType | undefined {
    if (!type) return undefined;
    return Object.values(PostType).includes(type as PostType)
      ? (type as PostType)
      : undefined;
  }

  @Put(':id/like')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async likePost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; type?: string } = {},
  ) {
    return this.postsService.likePost(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.type || 'LIKE',
    );
  }

  @Post(':id/react')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async reactPost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    data: { userId?: string; reactionType?: string; type?: string } = {},
  ) {
    return this.postsService.setReaction(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.reactionType || data.type || 'LIKE',
    );
  }

  @Delete(':id/react')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async unreactPost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.removeReaction(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Patch(':id/lock-comments')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async lockComments(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; lock?: boolean } = {},
  ) {
    return this.postsService.setCommentLock(
      id,
      resolveUserId(tokenUserId, data?.userId),
      !!data?.lock,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async editPost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; content?: string } = {},
  ) {
    return this.postsService.editPost(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.content || '',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async deletePost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.deletePost(
      id,
      resolveUserId(tokenUserId, data.userId),
    );
  }

  @Get(':id/comments')
  async getComments(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser('sub') viewerId?: string,
  ) {
    return this.postsService.getComments(
      id,
      Number(page) || 1,
      Number(limit) || 10,
      viewerId,
    );
  }

  @Get('comments/:commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser('sub') viewerId?: string,
  ) {
    return this.postsService.getReplies(
      commentId,
      Number(page) || 1,
      Number(limit) || 10,
      viewerId,
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async commentPost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; content?: string } = {},
  ) {
    return this.postsService.commentPost(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.content || '',
    );
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async toggleSave(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.toggleSave(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Delete(':id/save')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async unsave(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.unsave(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async sharePost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; content?: string } = {},
  ) {
    return this.postsService.sharePost(
      id,
      resolveUserId(tokenUserId, data?.userId),
      data?.content,
    );
  }

  @Delete('comments/:commentId/like')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async unlikeComment(
    @Param('commentId') commentId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.unlikeComment(
      commentId,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async likeComment(
    @Param('commentId') commentId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.postsService.toggleCommentLike(
      commentId,
      resolveUserId(tokenUserId, data?.userId),
    );
  }
}

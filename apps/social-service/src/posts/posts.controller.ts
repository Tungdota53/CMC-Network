import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('admin/all')
  async getAllPostsAdmin() {
    return this.postsService.getAllPostsAdmin();
  }

  @Delete('admin/:id')
  async adminDeletePost(@Param('id') id: string) {
    return this.postsService.adminDeletePost(id);
  }

  @Get('feed')
  async getFeed(@Query('page') page: string, @Query('limit') limit: string) {
    return this.postsService.getFeed(Number(page) || 1, Number(limit) || 10);
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
  async getUserPosts(@Param('userId') userId: string) {
    return this.postsService.getUserPosts(userId);
  }

  @Post('stories/:id/seen')
  async markStorySeen(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.postsService.markStorySeen(id, resolveUserId(tokenUserId, data.userId));
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.postsService.uploadImage(file);
  }

  @Post('stories')
  async createStory(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; mediaUrl: string; content?: string },
  ) {
    return this.postsService.createStory(resolveUserId(tokenUserId, data.userId), data.mediaUrl, data.content);
  }

  @Post()
  async createPost(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; content: string; mediaUrls?: string[] },
  ) {
    return this.postsService.createPost(resolveUserId(tokenUserId, data.userId), data.content, data.mediaUrls);
  }

  @Put(':id/like')
  async likePost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; type: string },
  ) {
    return this.postsService.likePost(id, resolveUserId(tokenUserId, data.userId), data.type);
  }

  @Put(':id')
  async editPost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; content: string },
  ) {
    return this.postsService.editPost(id, resolveUserId(tokenUserId, data.userId), data.content);
  }

  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.postsService.deletePost(id, resolveUserId(tokenUserId, data.userId));
  }

  @Post(':id/comments')
  async commentPost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; content: string },
  ) {
    return this.postsService.commentPost(id, resolveUserId(tokenUserId, data.userId), data.content);
  }

  @Post(':id/save')
  async toggleSave(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.postsService.toggleSave(id, resolveUserId(tokenUserId, data?.userId));
  }

  @Post(':id/share')
  async sharePost(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; content?: string },
  ) {
    return this.postsService.sharePost(id, resolveUserId(tokenUserId, data?.userId), data?.content);
  }

  @Post('comments/:commentId/like')
  async likeComment(
    @Param('commentId') commentId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.postsService.toggleCommentLike(commentId, resolveUserId(tokenUserId, data?.userId));
  }
}

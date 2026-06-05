import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  async getStories() {
    return this.postsService.getStories();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.postsService.uploadImage(file);
  }

  @Post('stories')
  async createStory(@Body() data: { userId: string; mediaUrl: string; content?: string }) {
    return this.postsService.createStory(data.userId, data.mediaUrl, data.content);
  }

  @Post()
  async createPost(@Body() data: { userId: string; content: string; mediaUrls?: string[] }) {
    return this.postsService.createPost(data.userId, data.content, data.mediaUrls);
  }

  @Put(':id/like')
  async likePost(@Param('id') id: string, @Body() data: { userId: string; type: string }) {
    return this.postsService.likePost(id, data.userId, data.type);
  }

  @Put(':id')
  async editPost(@Param('id') id: string, @Body() data: { userId: string; content: string }) {
    return this.postsService.editPost(id, data.userId, data.content);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string, @Body() data: { userId: string }) {
    return this.postsService.deletePost(id, data.userId);
  }

  @Post(':id/comments')
  async commentPost(@Param('id') id: string, @Body() data: { userId: string; content: string }) {
    return this.postsService.commentPost(id, data.userId, data.content);
  }
}

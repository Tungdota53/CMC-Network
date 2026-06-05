import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/all')
  async getAllUsers() {
    return this.usersService.getAllUsersAdmin();
  }

  @Put('admin/:id/suspend')
  async suspendUser(@Param('id') id: string) {
    return this.usersService.suspendUser(id);
  }

  @Put('admin/:id/role')
  async changeUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.usersService.changeUserRole(id, body.role);
  }

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Put(':id')
  async updateProfile(@Param('id') id: string, @Body() data: any) {
    return this.usersService.updateProfile(id, data);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(id, file);
  }

  @Get(':id/friends')
  async getFriends(@Param('id') id: string) {
    return this.usersService.getFriends(id);
  }

  @Get(':id/friends/requests')
  async getFriendRequests(@Param('id') id: string) {
    return this.usersService.getFriendRequests(id);
  }

  @Get(':id/friends/requests/sent')
  async getSentFriendRequests(@Param('id') id: string) {
    return this.usersService.getSentFriendRequests(id);
  }

  @Get(':id/friends/suggestions')
  async getFriendSuggestions(@Param('id') id: string) {
    return this.usersService.getFriendSuggestions(id);
  }

  @Get(':id/friends/search')
  async searchUsers(@Param('id') id: string, @Query('q') query = '') {
    return this.usersService.searchUsers(id, query);
  }

  @Post(':id/friends/request')
  async sendFriendRequest(@Param('id') id: string, @Body() body: { receiverId: string }) {
    return this.usersService.sendFriendRequest(id, body.receiverId);
  }

  @Put(':id/friends/request/:requestId')
  async respondFriendRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Body() body: { status: 'accepted' | 'rejected' },
  ) {
    return this.usersService.respondFriendRequest(id, requestId, body.status);
  }

  @Delete(':id/friends/request/:requestId')
  async cancelFriendRequest(@Param('id') id: string, @Param('requestId') requestId: string) {
    return this.usersService.cancelFriendRequest(id, requestId);
  }

  @Delete(':id/friends/:friendId')
  async removeFriend(@Param('id') id: string, @Param('friendId') friendId: string) {
    return this.usersService.removeFriend(id, friendId);
  }
}

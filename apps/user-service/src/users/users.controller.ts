import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
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

  // ----- Public profile (FE-005) -----

  @Get(':id/profile')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Put(':id/profile')
  async updatePublicProfile(@Param('id') id: string, @Body() data: any) {
    return this.usersService.updateProfile(id, data);
  }

  @Get(':id/posts')
  async getUserPosts(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.usersService.getUserPosts(id, limit ? Number(limit) : 20);
  }

  @Get(':id/photos')
  async getUserPhotos(@Param('id') id: string) {
    return this.usersService.getUserPhotos(id);
  }

  @Put(':id/cover')
  async updateCover(@Param('id') id: string, @Body() body: { coverPhotoUrl: string }) {
    return this.usersService.updateCover(id, body.coverPhotoUrl);
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

  // ----- Portfolio: skills / achievements / certificates / projects -----
  // Read endpoints are public (by :id). Mutating endpoints resolve the acting
  // user from the JWT (preferred) with a body `userId` fallback (compat window).

  @Get(':id/portfolio')
  async getPortfolio(@Param('id') id: string) {
    return this.usersService.getPortfolio(id);
  }

  @Post(':id/skills')
  async addSkill(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { skill: string; level?: string; userId?: string },
  ) {
    const userId = resolveUserId(tokenUserId, body.userId ?? id);
    return this.usersService.addSkill(userId, body.skill, body.level);
  }

  @Delete(':id/skills/:skillId')
  async removeSkill(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.removeSkill(userId, skillId);
  }

  @Post(':id/achievements')
  async addAchievement(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { title: string; description?: string; userId?: string },
  ) {
    const userId = resolveUserId(tokenUserId, body.userId ?? id);
    return this.usersService.addAchievement(userId, body.title, body.description);
  }

  @Delete(':id/achievements/:achievementId')
  async removeAchievement(
    @Param('id') id: string,
    @Param('achievementId') achievementId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.removeAchievement(userId, achievementId);
  }

  @Post(':id/certificates')
  async addCertificate(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { name: string; issuer: string; issuedAt: string; credentialUrl?: string; userId?: string },
  ) {
    const userId = resolveUserId(tokenUserId, body.userId ?? id);
    return this.usersService.addCertificate(userId, body);
  }

  @Delete(':id/certificates/:certificateId')
  async removeCertificate(
    @Param('id') id: string,
    @Param('certificateId') certificateId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.removeCertificate(userId, certificateId);
  }

  @Post(':id/projects')
  async addProject(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { title: string; description?: string; techStack?: string[]; githubUrl?: string; demoUrl?: string; userId?: string },
  ) {
    const userId = resolveUserId(tokenUserId, body.userId ?? id);
    return this.usersService.addProject(userId, body);
  }

  @Delete(':id/projects/:projectId')
  async removeProject(
    @Param('id') id: string,
    @Param('projectId') projectId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.removeProject(userId, projectId);
  }
}

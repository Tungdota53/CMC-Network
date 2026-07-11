import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  resolveUserId,
} from '@campus-connect/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========= ADMIN ROUTES (require ADMIN role) =========

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllUsers() {
    return this.usersService.getAllUsersAdmin();
  }

  @Put('admin/:id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async suspendUser(@Param('id') id: string) {
    return this.usersService.suspendUser(id);
  }

  @Put('admin/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async changeUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    return this.usersService.changeUserRole(id, body.role);
  }

  // ========= USER PROFILE (ownership verified) =========

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Put(':id')
  async updateProfile(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: any,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.updateProfile(userId, data);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.uploadAvatar(userId, file);
  }

  // ----- Public profile (FE-005) -----

  @Get(':id/profile')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Put(':id/profile')
  async updatePublicProfile(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: any,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.updateProfile(userId, data);
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
  async updateCover(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { coverPhotoUrl: string },
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.updateCover(userId, body.coverPhotoUrl);
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
  async sendFriendRequest(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { receiverId: string },
  ) {
    const senderId = resolveUserId(tokenUserId, id);
    return this.usersService.sendFriendRequest(senderId, body.receiverId);
  }

  @Put(':id/friends/request/:requestId')
  async respondFriendRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { status: 'accepted' | 'rejected' },
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.respondFriendRequest(
      userId,
      requestId,
      body.status,
    );
  }

  @Delete(':id/friends/request/:requestId')
  async cancelFriendRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.cancelFriendRequest(userId, requestId);
  }

  @Delete(':id/friends/:friendId')
  async removeFriend(
    @Param('id') id: string,
    @Param('friendId') friendId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.removeFriend(userId, friendId);
  }

  // ----- Portfolio: skills / achievements / certificates / projects -----

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
    return this.usersService.addAchievement(
      userId,
      body.title,
      body.description,
    );
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
    @Body()
    body: {
      name: string;
      issuer: string;
      issuedAt: string;
      credentialUrl?: string;
      userId?: string;
    },
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
    @Body()
    body: {
      title: string;
      description?: string;
      techStack?: string[];
      githubUrl?: string;
      demoUrl?: string;
      userId?: string;
    },
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

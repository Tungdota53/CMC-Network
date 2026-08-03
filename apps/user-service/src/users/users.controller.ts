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
  Public,
  Roles,
  RolesGuard,
  resolveUserId,
} from '@campus-connect/common';
import 'multer';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
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
    @Body() body: { role?: string } = {},
  ) {
    return this.usersService.changeUserRole(id, body.role ?? 'USER');
  }

  // ========= USER PROFILE (ownership verified) =========

  @Get('count')
  @Public()
  async getUserCount() {
    return this.usersService.getUserCount();
  }

  @Get('me')
  async getMe(@CurrentUser('sub') tokenUserId: string | undefined) {
    return this.usersService.getProfile(resolveUserId(tokenUserId));
  }

  @Get(':id')
  @Public()
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Put(':id')
  async updateProfile(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: any = {},
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
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.uploadAvatar(userId, file);
  }

  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.uploadCover(userId, file);
  }

  // ----- Public profile (FE-005) -----

  @Get(':id/profile')
  @Public()
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Put(':id/profile')
  async updatePublicProfile(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: any = {},
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.updateProfile(userId, data);
  }

  @Put(':id/email')
  async updateEmail(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { email?: string } = {},
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.updateEmail(userId, body.email ?? '');
  }

  @Put(':id/password')
  async changePassword(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { currentPassword?: string; newPassword?: string } = {},
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.changePassword(
      userId,
      body.currentPassword ?? '',
      body.newPassword ?? '',
    );
  }

  @Get(':id/posts')
  @Public()
  async getUserPosts(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.usersService.getUserPosts(id, limit ? Number(limit) : 20);
  }

  @Get(':id/photos')
  @Public()
  async getUserPhotos(@Param('id') id: string) {
    return this.usersService.getUserPhotos(id);
  }

  @Put(':id/cover')
  async updateCover(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { coverPhotoUrl?: string } = {},
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.updateCover(userId, body.coverPhotoUrl ?? '');
  }

  @Get(':id/friends')
  @Public()
  async getFriends(@Param('id') id: string) {
    return this.usersService.getFriends(id);
  }

  @Get([':id/friends/requests', ':id/friends/requests/incoming'])
  async getFriendRequests(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    return this.usersService.getFriendRequests(resolveUserId(tokenUserId));
  }

  @Get([':id/friends/requests/sent', ':id/friends/requests/outgoing'])
  async getSentFriendRequests(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    return this.usersService.getSentFriendRequests(resolveUserId(tokenUserId));
  }

  @Get(':id/friends/blocked')
  async getBlockedUsers(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    return this.usersService.getBlockedUsers(resolveUserId(tokenUserId));
  }

  @Get(':id/friends/mutual/:targetId')
  @Public()
  async getMutualFriends(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    return this.usersService.getMutualFriends(id, targetId);
  }

  @Get(':id/friends/suggestions')
  async getFriendSuggestions(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    return this.usersService.getFriendSuggestions(resolveUserId(tokenUserId));
  }

  @Get(':id/friends/search')
  async searchUsers(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('q') query = '',
  ) {
    return this.usersService.searchUsers(resolveUserId(tokenUserId), query);
  }

  @Post(':id/friends/request')
  async sendFriendRequest(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { receiverId?: string } = {},
  ) {
    const senderId = resolveUserId(tokenUserId, id);
    return this.usersService.sendFriendRequest(senderId, body.receiverId ?? '');
  }

  // ----- Target-id based friend actions (FE `/friends/*/:targetId`) -----

  @Post(':id/friends/request/:targetId')
  async sendFriendRequestByTarget(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const senderId = resolveUserId(tokenUserId, id);
    return this.usersService.sendFriendRequest(senderId, targetId);
  }

  @Post(':id/friends/accept/:targetId')
  async acceptFriendRequestByTarget(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.acceptFriendRequestByTarget(userId, targetId);
  }

  @Delete(':id/friends/cancel/:targetId')
  async cancelFriendRequestByTarget(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.cancelFriendRequestByTarget(userId, targetId);
  }

  @Post(':id/friends/reject/:targetId')
  async rejectFriendRequestByTarget(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.rejectFriendRequestByTarget(userId, targetId);
  }

  @Post(':id/friends/block/:targetId')
  async blockUser(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.blockUser(userId, targetId);
  }

  @Delete(':id/friends/block/:targetId')
  async unblockUser(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.unblockUser(userId, targetId);
  }

  @Put(':id/friends/request/:requestId')
  async respondFriendRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { status?: 'accepted' | 'rejected' } = {},
  ) {
    const userId = resolveUserId(tokenUserId, id);
    return this.usersService.respondFriendRequest(
      userId,
      requestId,
      body.status ?? 'rejected',
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
  @Public()
  async getPortfolio(@Param('id') id: string) {
    return this.usersService.getPortfolio(id);
  }

  @Post(':id/skills')
  async addSkill(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() body: { skill?: string; level?: string; userId?: string } = {},
  ) {
    const userId = resolveUserId(tokenUserId, body.userId ?? id);
    return this.usersService.addSkill(userId, body.skill ?? '', body.level);
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
    @Body()
    body: { title?: string; description?: string; userId?: string } = {},
  ) {
    const userId = resolveUserId(tokenUserId, body.userId ?? id);
    return this.usersService.addAchievement(
      userId,
      body.title ?? '',
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
    } = { name: '', issuer: '', issuedAt: '' },
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
    } = { title: '' },
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

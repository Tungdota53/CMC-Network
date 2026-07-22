import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { ClubsService } from './clubs.service';
import 'multer';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  async list(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('joinMode') joinMode?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    return this.clubsService.list(
      { search, category, type, joinMode, sort, page, limit },
      tokenUserId || userId,
    );
  }

  @Post()
  async create(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { ownerId?: string; [key: string]: unknown } = {},
  ) {
    return this.clubsService.create(
      resolveUserId(tokenUserId, data.ownerId),
      data,
    );
  }

  @Get(':id')
  async detail(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('userId') userId?: string,
  ) {
    return this.clubsService.detail(id, tokenUserId || userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.clubsService.update(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body('userId') userId: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.clubsService.uploadImage(
      id,
      resolveUserId(tokenUserId, userId),
      file,
      'logo',
    );
  }

  @Post(':id/banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body('userId') userId: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.clubsService.uploadImage(
      id,
      resolveUserId(tokenUserId, userId),
      file,
      'banner',
    );
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string } = {},
  ) {
    return this.clubsService.delete(
      id,
      resolveUserId(tokenUserId, data.userId),
    );
  }

  @Get(':id/analytics')
  async analytics(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('userId') userId?: string,
  ) {
    return this.clubsService.analytics(id, resolveUserId(tokenUserId, userId));
  }

  @Get(':id/requests')
  async listJoinRequests(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('userId') userId?: string,
  ) {
    return this.clubsService.listJoinRequests(
      id,
      resolveUserId(tokenUserId, userId),
    );
  }

  @Post(':id/requests/:requestId/approve')
  async approveJoinRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body('userId') userId?: string,
  ) {
    return this.clubsService.approveJoinRequest(
      id,
      requestId,
      resolveUserId(tokenUserId, userId),
    );
  }

  @Post(':id/requests/:requestId/reject')
  async rejectJoinRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body('userId') userId?: string,
  ) {
    return this.clubsService.rejectJoinRequest(
      id,
      requestId,
      resolveUserId(tokenUserId, userId),
    );
  }

  @Put(':id/members/:memberId/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; role?: string } = {},
  ) {
    return this.clubsService.updateMemberRole(
      id,
      memberId,
      resolveUserId(tokenUserId, data.userId),
      data.role,
    );
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body('userId') userId?: string,
  ) {
    return this.clubsService.removeMember(
      id,
      memberId,
      resolveUserId(tokenUserId, userId),
    );
  }

  @Post(':id/join')
  async join(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body('userId') userId?: string,
  ) {
    return this.clubsService.join(id, resolveUserId(tokenUserId, userId));
  }

  @Delete(':id/join')
  async leave(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body('userId') userId?: string,
  ) {
    return this.clubsService.leave(id, resolveUserId(tokenUserId, userId));
  }
}

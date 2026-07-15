import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
  VerifiedUserGuard,
  resolveUserId,
} from '@campus-connect/common';
import { StudyService } from './study.service';

@Controller('study-groups')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Get()
  async getGroups() {
    return this.studyService.getStudyGroups();
  }

  // --- STUDY REQUESTS ---

  @Get('requests')
  async getStudyRequests() {
    return this.studyService.getStudyRequests();
  }

  @Post('requests')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async createStudyRequest(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.studyService.createStudyRequest(
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Put('requests/:id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateStudyRequest(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.studyService.updateStudyRequest(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete('requests/:id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async deleteStudyRequest(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.studyService.deleteStudyRequest(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async createGroup(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { creatorId?: string; [key: string]: unknown } = {},
  ) {
    return this.studyService.createStudyGroup({
      ...data,
      creatorId: resolveUserId(tokenUserId, data.creatorId),
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateGroup(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.studyService.updateStudyGroup(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async deleteGroup(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.studyService.deleteStudyGroup(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Post(':id/join-requests')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async requestToJoin(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.studyService.requestToJoin(
      id,
      resolveUserId(tokenUserId, data.userId),
    );
  }

  @Get(':id/join-requests')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async listJoinRequests(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Query('userId') userId?: string,
  ) {
    return this.studyService.listJoinRequests(
      id,
      resolveUserId(tokenUserId, userId),
    );
  }

  @Put(':id/join-requests/:requestId')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async respondJoinRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; action?: 'accept' | 'reject' } = {},
  ) {
    return this.studyService.respondJoinRequest(
      id,
      resolveUserId(tokenUserId, data.userId),
      requestId,
      data.action ?? 'reject',
    );
  }

  @Put(':id/whiteboard')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateWhiteboard(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; whiteboardData?: any } = {},
  ) {
    return this.studyService.updateWhiteboard(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.whiteboardData,
    );
  }

  @Put(':id/todo-list')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateTodoList(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; todoList?: any } = {},
  ) {
    return this.studyService.updateTodoList(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.todoList,
    );
  }

  @Get(':id')
  async getGroup(@Param('id') id: string) {
    return this.studyService.getStudyGroupById(id);
  }
}

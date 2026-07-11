import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { StudyService } from './study.service';

@Controller('study-groups')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Get()
  async getGroups() {
    return this.studyService.getStudyGroups();
  }

  @Post()
  async createGroup(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { creatorId?: string; [key: string]: unknown },
  ) {
    return this.studyService.createStudyGroup({
      ...data,
      creatorId: resolveUserId(tokenUserId, data.creatorId),
    });
  }

  @Put(':id')
  async updateGroup(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown },
  ) {
    return this.studyService.updateStudyGroup(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete(':id')
  async deleteGroup(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.studyService.deleteStudyGroup(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Post(':id/join-requests')
  async requestToJoin(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.studyService.requestToJoin(
      id,
      resolveUserId(tokenUserId, data.userId),
    );
  }

  @Get(':id/join-requests')
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
  async respondJoinRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; action: 'accept' | 'reject' },
  ) {
    return this.studyService.respondJoinRequest(
      id,
      resolveUserId(tokenUserId, data.userId),
      requestId,
      data.action,
    );
  }

  @Put(':id/whiteboard')
  async updateWhiteboard(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; whiteboardData: any },
  ) {
    return this.studyService.updateWhiteboard(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.whiteboardData,
    );
  }

  @Put(':id/todo-list')
  async updateTodoList(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; todoList: any },
  ) {
    return this.studyService.updateTodoList(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.todoList,
    );
  }

  // --- STUDY REQUESTS ---

  @Get('requests')
  async getStudyRequests() {
    return this.studyService.getStudyRequests();
  }

  @Post('requests')
  async createStudyRequest(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown },
  ) {
    return this.studyService.createStudyRequest(
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Put('requests/:id')
  async updateStudyRequest(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown },
  ) {
    return this.studyService.updateStudyRequest(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete('requests/:id')
  async deleteStudyRequest(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.studyService.deleteStudyRequest(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }
}

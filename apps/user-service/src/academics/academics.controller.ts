import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { AcademicsService } from './academics.service';

@Controller()
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get('grades')
  async getGrades(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('userId') userId?: string,
  ) {
    return this.academicsService.getGrades(resolveUserId(tokenUserId, userId));
  }

  @Get('grades/summary')
  async getGradeSummary(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('userId') userId?: string,
  ) {
    return this.academicsService.getGradeSummary(
      resolveUserId(tokenUserId, userId),
    );
  }

  @Get('grades/faculty-comparison')
  async getFacultyComparison(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('userId') userId?: string,
  ) {
    return this.academicsService.getFacultyComparison(
      resolveUserId(tokenUserId, userId),
    );
  }

  @Post('grades')
  async createGrade(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.academicsService.createGrade(
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Post('grades/import')
  async importGrades(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; items?: Record<string, unknown>[] } = {},
  ) {
    return this.academicsService.importGrades(
      resolveUserId(tokenUserId, data.userId),
      data.items ?? [],
    );
  }

  @Put('grades/:id')
  async updateGrade(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.academicsService.updateGrade(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete('grades/:id')
  async deleteGrade(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string } = {},
  ) {
    return this.academicsService.deleteGrade(
      id,
      resolveUserId(tokenUserId, data.userId),
    );
  }

  @Get('timetable/events')
  async getTimetableEvents(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('userId') userId?: string,
  ) {
    return this.academicsService.getTimetableEvents(
      resolveUserId(tokenUserId, userId),
    );
  }

  @Get('timetable/classmates')
  async getClassmates(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('classCode') classCode = '',
    @Query('userId') userId?: string,
  ) {
    return this.academicsService.getClassmates(
      resolveUserId(tokenUserId, userId),
      classCode,
    );
  }

  @Post('timetable/events')
  async createTimetableEvent(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.academicsService.createTimetableEvent(
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Post('timetable/import')
  async importTimetableEvents(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; items?: Record<string, unknown>[] } = {},
  ) {
    return this.academicsService.importTimetableEvents(
      resolveUserId(tokenUserId, data.userId),
      data.items ?? [],
    );
  }

  @Put('timetable/events/:id')
  async updateTimetableEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.academicsService.updateTimetableEvent(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete('timetable/events/:id')
  async deleteTimetableEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string } = {},
  ) {
    return this.academicsService.deleteTimetableEvent(
      id,
      resolveUserId(tokenUserId, data.userId),
    );
  }
}

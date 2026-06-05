import { Controller, Get, Post, Body } from '@nestjs/common';
import { StudyService } from './study.service';

@Controller('study-groups')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Get()
  async getGroups() {
    return this.studyService.getStudyGroups();
  }

  @Post()
  async createGroup(@Body() data: any) {
    return this.studyService.createStudyGroup(data);
  }
}

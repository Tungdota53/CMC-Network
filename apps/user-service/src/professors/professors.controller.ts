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
import { ProfessorsService } from './professors.service';

@Controller('professors')
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('faculty') faculty?: string,
    @Query('sort') sort?: string,
  ) {
    return this.professorsService.list({ search, faculty, sort });
  }

  @Post()
  async create(@Body() data: Record<string, unknown> = {}) {
    return this.professorsService.create(data);
  }

  @Get(':id/reviews')
  async reviews(@Param('id') id: string) {
    return this.professorsService.reviews(id);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.professorsService.detail(id);
  }

  @Post(':id/reviews')
  async upsertReview(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.professorsService.upsertReview(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Put(':id/reviews/me')
  async updateMyReview(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.professorsService.upsertReview(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete(':id/reviews/me')
  async deleteMyReview(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body() data: { userId?: string } = {},
  ) {
    return this.professorsService.deleteMyReview(
      id,
      resolveUserId(tokenUserId, data.userId),
    );
  }
}

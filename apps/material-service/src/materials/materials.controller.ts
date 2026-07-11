import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { MaterialsService } from './materials.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  async getMaterials(@Query('subject') subject: string) {
    return this.materialsService.getMaterials(subject);
  }

  @Post('upload')
  async uploadMaterial(
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    data: {
      uploaderId?: string;
      fileBuffer?: string;
      fileName?: string;
      [key: string]: unknown;
    },
  ) {
    if (!data.fileBuffer) throw new BadRequestException('Vui lòng chọn file');

    // Strict limits based on user request (10MB for PDF, 20MB for Document)
    const maxSize = data.fileName?.endsWith('.pdf')
      ? 10 * 1024 * 1024
      : 20 * 1024 * 1024;
    const buffer = Buffer.from(data.fileBuffer, 'base64');

    if (buffer.length > maxSize) {
      throw new BadRequestException(
        `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`,
      );
    }

    const mimeType = data.fileName?.endsWith('.pdf')
      ? 'application/pdf'
      : 'application/octet-stream';

    return this.materialsService.uploadMaterial({
      ...data,
      fileBuffer: buffer,
      mimeType,
      uploaderId: resolveUserId(tokenUserId, data.uploaderId),
    } as never);
  }

  @Put(':id')
  async updateMaterial(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    data: {
      userId?: string;
      title?: string;
      description?: string;
      subject?: string;
      semester?: string;
      tags?: string[];
    },
  ) {
    return this.materialsService.updateMaterial(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete(':id')
  async deleteMaterial(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.materialsService.deleteMaterial(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Post(':id/download')
  async download(@Param('id') id: string) {
    return this.materialsService.incrementDownload(id);
  }

  @Get('bookmarks/:userId')
  async getBookmarks(@Param('userId') userId: string) {
    return this.materialsService.getBookmarks(userId);
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.materialsService.getReviews(id);
  }

  @Post(':id/reviews')
  async reviewMaterial(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; rating: number; comment?: string },
  ) {
    return this.materialsService.reviewMaterial(
      id,
      resolveUserId(tokenUserId, data.userId),
      data.rating,
      data.comment,
    );
  }

  @Post(':id/bookmark')
  async toggleBookmark(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.materialsService.toggleBookmark(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }
}

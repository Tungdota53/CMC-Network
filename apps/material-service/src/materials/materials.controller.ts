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
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  JwtAuthGuard,
  VerifiedUserGuard,
} from '@campus-connect/common';
import { MaterialsService } from './materials.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get('legacy/recommendations')
  async getLegacyRecommendations() {
    return this.materialsService.getLegacyRecommendations();
  }

  @Get()
  async getMaterials(
    @Query('subject') subject?: string,
    @Query('search') search?: string,
    @Query('fileType') fileType?: string,
  ) {
    return this.materialsService.getMaterials({ subject, search, fileType });
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async uploadMaterial(
    @CurrentUser('sub') uploaderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    data: {
      uploaderId?: string;
      fileBuffer?: string;
      fileName?: string;
      [key: string]: unknown;
    } = {},
  ) {
    if (data.fileBuffer && data.fileBuffer.length > 28 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the limit of 20MB');
    }

    const fileName = file?.originalname ?? data.fileName;
    const buffer =
      file?.buffer ??
      (data.fileBuffer ? Buffer.from(data.fileBuffer, 'base64') : undefined);
    if (!buffer || !fileName)
      throw new BadRequestException('Vui lòng chọn file');

    // Strict limits based on user request (10MB for PDF, 20MB for Document)
    const maxSize = fileName.endsWith('.pdf')
      ? 10 * 1024 * 1024
      : 20 * 1024 * 1024;

    if (buffer.length > maxSize) {
      throw new BadRequestException(
        `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`,
      );
    }

    const mimeType =
      file?.mimetype ??
      (fileName.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/octet-stream');

    return this.materialsService.uploadMaterial({
      ...data,
      fileBuffer: buffer,
      fileName,
      mimeType,
      uploaderId,
    } as never);
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async getMyBookmarks(@CurrentUser('sub') userId: string) {
    return this.materialsService.getBookmarks(userId);
  }

  @Get('bookmarks/:userId')
  async getBookmarks(@Param('userId') userId: string) {
    return this.materialsService.getBookmarks(userId);
  }

  @Get(':id/flashcards')
  async getFlashcards(@Param('id') id: string) {
    return this.materialsService.getFlashcards(id);
  }

  @Get(':id/quiz')
  async getQuiz(@Param('id') id: string) {
    return this.materialsService.getQuiz(id);
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.materialsService.getReviews(id);
  }

  @Get(':id')
  async getMaterial(@Param('id') id: string) {
    return this.materialsService.getMaterial(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateMaterial(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body()
    data: {
      userId?: string;
      title?: string;
      description?: string;
      subject?: string;
      semester?: string;
      tags?: string[];
    } = {},
  ) {
    return this.materialsService.updateMaterial(id, userId, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async deleteMaterial(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.materialsService.deleteMaterial(id, userId);
  }

  @Post(':id/download')
  async download(@Param('id') id: string) {
    return this.materialsService.incrementDownload(id);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async reviewMaterial(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() data: { userId?: string; rating?: number; comment?: string } = {},
  ) {
    return this.materialsService.reviewMaterial(
      id,
      userId,
      data.rating ?? 0,
      data.comment,
    );
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async toggleBookmark(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.materialsService.toggleBookmark(id, userId);
  }
}

import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import 'multer';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  async getProducts(@Query('status') status: string) {
    return this.marketplaceService.getProducts(status);
  }

  @Get('search')
  async searchProducts(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('status') status?: string,
  ) {
    const parsedMinPrice = this.parseOptionalPrice(minPrice, 'minPrice');
    const parsedMaxPrice = this.parseOptionalPrice(maxPrice, 'maxPrice');

    return this.marketplaceService.searchProducts({
      keyword,
      category,
      condition,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
      status,
    });
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.marketplaceService.getProductById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async createProduct(
    @CurrentUser('sub') sellerId: string,
    @Body() data: { sellerId?: string; [key: string]: unknown } = {},
  ) {
    return this.marketplaceService.createProduct({
      ...data,
      sellerId,
    });
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.marketplaceService.uploadImage(file);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateProduct(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.marketplaceService.updateProduct(id, userId, data);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() data: { userId?: string; status?: string } = {},
  ) {
    return this.marketplaceService.updateStatus(id, userId, data.status ?? '');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.marketplaceService.deleteProduct(id, userId);
  }

  @Put(':id/buy')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async buyProduct(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.marketplaceService.buyProduct(id, userId);
  }

  private parseOptionalPrice(value: string | undefined, field: string) {
    if (value === undefined || value === '') return undefined;

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }

    return parsedValue;
  }
}

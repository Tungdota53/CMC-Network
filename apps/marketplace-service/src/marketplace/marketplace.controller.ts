import { Controller, Get, Post, Put, Delete, Body, Param, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
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
    return this.marketplaceService.searchProducts({
      keyword,
      category,
      condition,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      status,
    });
  }

  @Post()
  async createProduct(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { sellerId?: string; [key: string]: unknown },
  ) {
    return this.marketplaceService.createProduct({
      ...data,
      sellerId: resolveUserId(tokenUserId, data.sellerId),
    });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.marketplaceService.uploadImage(file);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown },
  ) {
    return this.marketplaceService.updateProduct(id, resolveUserId(tokenUserId, data.userId), data);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; status: string },
  ) {
    return this.marketplaceService.updateStatus(id, resolveUserId(tokenUserId, data.userId), data.status);
  }

  @Delete(':id')
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.marketplaceService.deleteProduct(id, resolveUserId(tokenUserId, data?.userId));
  }

  @Put(':id/buy')
  async buyProduct(@Param('id') id: string) {
    return this.marketplaceService.buyProduct(id);
  }
}

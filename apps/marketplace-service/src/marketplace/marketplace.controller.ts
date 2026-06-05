import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  async getProducts(@Query('status') status: string) {
    return this.marketplaceService.getProducts(status);
  }

  @Post()
  async createProduct(@Body() data: any) {
    return this.marketplaceService.createProduct(data);
  }

  @Put(':id/buy')
  async buyProduct(@Param('id') id: string) {
    return this.marketplaceService.buyProduct(id);
  }
}

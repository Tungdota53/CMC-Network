import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q = '', @Query('take') take?: string) {
    return this.searchService.searchAll(q, take ? Number(take) : 5);
  }
}

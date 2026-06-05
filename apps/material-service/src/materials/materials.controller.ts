import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { MaterialsService } from './materials.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  async getMaterials(@Query('subject') subject: string) {
    return this.materialsService.getMaterials(subject);
  }

  @Post('upload')
  async uploadMaterial(@Body() data: any) {
    return this.materialsService.uploadMaterial(data);
  }
}

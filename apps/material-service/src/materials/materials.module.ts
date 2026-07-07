import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { MaterialProcessor } from './material.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'material-processing',
    }),
  ],
  providers: [MaterialsService, MaterialProcessor],
  controllers: [MaterialsController],
})
export class MaterialsModule {}

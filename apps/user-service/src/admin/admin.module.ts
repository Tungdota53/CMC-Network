import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController, ReportsController } from './admin.controller';

@Module({
  providers: [AdminService],
  controllers: [AdminController, ReportsController],
})
export class AdminModule {}

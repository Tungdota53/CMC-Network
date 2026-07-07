import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CommonModule } from '@campus-connect/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MaterialsModule } from './materials/materials.module';

@Module({
  imports: [
    CommonModule.register({ enableAuth: false, optionalAuth: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    MaterialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

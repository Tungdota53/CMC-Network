import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { StudyModule } from './study/study.module';

@Module({
  imports: [StudyModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { CommonModule } from '@campus-connect/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    CommonModule.register({ enableAuth: false, optionalAuth: true }),
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

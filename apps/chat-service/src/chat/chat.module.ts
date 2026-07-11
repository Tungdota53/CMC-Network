import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PresenceService } from './presence.service';

@Module({
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PresenceService],
  exports: [PresenceService],
})
export class ChatModule {}

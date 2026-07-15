import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PresenceService } from './presence.service';
import { LiveKitService } from './livekit.service';
import { WebrtcService } from './webrtc.service';

@Module({
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PresenceService, LiveKitService, WebrtcService],
  exports: [PresenceService],
})
export class ChatModule {}

import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations/:userId')
  async getConversations(@Param('userId') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Post('conversations/direct')
  async getOrCreateDirectConversation(@Body() body: { user1Id: string; user2Id: string }) {
    return this.chatService.getOrCreateDirectConversation(body.user1Id, body.user2Id);
  }
}

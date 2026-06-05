import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents(@Query('status') status?: string) {
    return this.eventsService.getEvents(status);
  }

  @Post()
  async createEvent(@Body() data: any) {
    return this.eventsService.createEvent(data);
  }

  @Post(':id/join')
  async joinEvent(@Param('id') id: string, @Body('userId') userId: string) {
    return this.eventsService.joinEvent(id, userId);
  }
}

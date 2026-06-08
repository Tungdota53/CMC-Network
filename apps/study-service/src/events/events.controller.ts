import { Body, Controller, Get, Param, Post, Put, Delete, Query } from '@nestjs/common';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents(@Query('status') status?: string) {
    return this.eventsService.getEvents(status);
  }

  @Post()
  async createEvent(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { organizerId?: string; [key: string]: unknown },
  ) {
    return this.eventsService.createEvent({
      ...data,
      organizerId: resolveUserId(tokenUserId, data.organizerId),
    });
  }

  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown },
  ) {
    return this.eventsService.updateEvent(id, resolveUserId(tokenUserId, data.userId), data);
  }

  @Delete(':id')
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.eventsService.deleteEvent(id, resolveUserId(tokenUserId, data?.userId));
  }

  @Post(':id/join')
  async joinEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body('userId') userId?: string,
  ) {
    return this.eventsService.joinEvent(id, resolveUserId(tokenUserId, userId));
  }

  @Delete(':id/join')
  async leaveEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body('userId') userId?: string,
  ) {
    return this.eventsService.leaveEvent(id, resolveUserId(tokenUserId, userId));
  }

  @Post(':id/checkin')
  async checkIn(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string },
  ) {
    return this.eventsService.checkIn(id, resolveUserId(tokenUserId, data?.userId));
  }

  @Get(':id/attendees')
  async getAttendees(@Param('id') id: string) {
    return this.eventsService.getAttendees(id);
  }
}

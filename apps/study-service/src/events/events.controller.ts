import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
  VerifiedUserGuard,
  resolveUserId,
} from '@campus-connect/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents(@Query('status') status?: string) {
    return this.eventsService.getEvents(status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async createEvent(
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { organizerId?: string; [key: string]: unknown } = {},
  ) {
    return this.eventsService.createEvent({
      ...data,
      organizerId: resolveUserId(tokenUserId, data.organizerId),
    });
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    return this.eventsService.getEvent(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async updateEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string; [key: string]: unknown } = {},
  ) {
    return this.eventsService.updateEvent(
      id,
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.eventsService.deleteEvent(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async joinEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body('userId') userId?: string,
  ) {
    return this.eventsService.joinEvent(id, resolveUserId(tokenUserId, userId));
  }

  @Delete(':id/join')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async leaveEvent(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body('userId') userId?: string,
  ) {
    return this.eventsService.leaveEvent(
      id,
      resolveUserId(tokenUserId, userId),
    );
  }

  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  async checkIn(
    @Param('id') id: string,
    @CurrentUser('sub') tokenUserId: string,
    @Body() data: { userId?: string } = {},
  ) {
    return this.eventsService.checkIn(
      id,
      resolveUserId(tokenUserId, data?.userId),
    );
  }

  @Get(':id/attendees')
  async getAttendees(@Param('id') id: string) {
    return this.eventsService.getAttendees(id);
  }
}

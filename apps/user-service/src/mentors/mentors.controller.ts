import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { MentorsService } from './mentors.service';

@Controller('mentors')
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  async getMentors(@Query('expertise') expertise?: string) {
    return this.mentorsService.getMentors(expertise);
  }

  @Get('bookings/:userId')
  async getBookings(
    @Param('userId') userId: string,
    @Query('role') role: 'mentor' | 'mentee' = 'mentee',
  ) {
    return this.mentorsService.getBookings(userId, role);
  }

  @Get(':userId')
  async getMentorProfile(@Param('userId') userId: string) {
    return this.mentorsService.getMentorProfile(userId);
  }

  @Post('register/:userId')
  async registerMentor(
    @Param('userId') userId: string,
    @Body()
    data: {
      bio?: string;
      expertise?: string[];
      gpa?: number;
      schedule?: unknown;
    },
  ) {
    return this.mentorsService.registerMentor(userId, data);
  }

  @Post('bookings/:menteeId')
  async createBooking(
    @Param('menteeId') menteeId: string,
    @Body()
    data: {
      mentorId: string;
      scheduledAt: string;
      topic?: string;
      notes?: string;
    },
  ) {
    return this.mentorsService.createBooking(menteeId, data);
  }

  @Put('bookings/:userId/:bookingId')
  async updateBookingStatus(
    @Param('userId') userId: string,
    @Param('bookingId') bookingId: string,
    @Body()
    body: { status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' },
  ) {
    return this.mentorsService.updateBookingStatus(
      userId,
      bookingId,
      body.status,
    );
  }

  @Post('reviews/:menteeId')
  async reviewMentor(
    @Param('menteeId') menteeId: string,
    @Body() data: { bookingId: string; rating: number; comment?: string },
  ) {
    return this.mentorsService.reviewMentor(menteeId, data);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
  Public,
  resolveUserId,
} from '@campus-connect/common';
import { MentorsService } from './mentors.service';

@Controller('mentors')
@UseGuards(JwtAuthGuard)
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  @Public()
  async getMentors(@Query('expertise') expertise?: string) {
    return this.mentorsService.getMentors(expertise);
  }

  @Get('bookings/:userId')
  async getBookings(
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('role') role: 'mentor' | 'mentee' = 'mentee',
  ) {
    return this.mentorsService.getBookings(resolveUserId(tokenUserId), role);
  }

  @Get('me')
  async getMyMentorProfile(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('userId') userId?: string,
  ) {
    return this.mentorsService.getMentorProfile(
      resolveUserId(tokenUserId, userId),
    );
  }

  @Get('bookings')
  async getMyBookings(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Query('role') role: 'mentor' | 'mentee' = 'mentee',
    @Query('userId') userId?: string,
  ) {
    return this.mentorsService.getBookings(
      resolveUserId(tokenUserId, userId),
      role,
    );
  }

  @Post('me')
  async registerMe(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body()
    data: {
      userId?: string;
      bio?: string;
      expertise?: string[];
      gpa?: number;
      schedule?: unknown;
    } = {},
  ) {
    return this.mentorsService.registerMentor(
      resolveUserId(tokenUserId, data.userId),
      data,
    );
  }

  @Post(':id/book')
  async bookMentor(
    @Param('id') mentorId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body()
    data: {
      menteeId?: string;
      scheduledAt?: string;
      topic?: string;
      notes?: string;
    } = {},
  ) {
    return this.mentorsService.createBooking(
      resolveUserId(tokenUserId, data.menteeId),
      {
        mentorId,
        scheduledAt: data.scheduledAt ?? '',
        topic: data.topic,
        notes: data.notes,
      },
    );
  }

  @Put('bookings/:bookingId')
  async updateMyBookingStatus(
    @Param('bookingId') bookingId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body()
    body: {
      userId?: string;
      status?: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    } = {},
  ) {
    return this.mentorsService.updateBookingStatus(
      resolveUserId(tokenUserId, body.userId),
      bookingId,
      body.status ?? 'CANCELLED',
    );
  }

  @Post('reviews')
  async reviewMentorMe(
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body()
    data: {
      menteeId?: string;
      bookingId?: string;
      rating?: number;
      comment?: string;
    } = {},
  ) {
    return this.mentorsService.reviewMentor(
      resolveUserId(tokenUserId, data.menteeId),
      {
        bookingId: data.bookingId ?? '',
        rating: data.rating ?? 0,
        comment: data.comment,
      },
    );
  }

  @Get(':userId')
  @Public()
  async getMentorProfile(@Param('userId') userId: string) {
    return this.mentorsService.getMentorProfile(userId);
  }

  @Post('register/:userId')
  async registerMentor(
    @Param('userId') userId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body()
    data: {
      bio?: string;
      expertise?: string[];
      gpa?: number;
      schedule?: unknown;
    } = {},
  ) {
    return this.mentorsService.registerMentor(resolveUserId(tokenUserId), data);
  }

  @Post('bookings/:menteeId')
  async createBooking(
    @Param('menteeId') menteeId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body()
    data: {
      mentorId: string;
      scheduledAt: string;
      topic?: string;
      notes?: string;
    } = { mentorId: '', scheduledAt: '' },
  ) {
    return this.mentorsService.createBooking(resolveUserId(tokenUserId), data);
  }

  @Put('bookings/:userId/:bookingId')
  async updateBookingStatus(
    @Param('userId') userId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body()
    body: { status?: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' } = {},
  ) {
    return this.mentorsService.updateBookingStatus(
      resolveUserId(tokenUserId),
      bookingId,
      body.status ?? 'CANCELLED',
    );
  }

  @Post('reviews/:menteeId')
  async reviewMentor(
    @Param('menteeId') menteeId: string,
    @CurrentUser('sub') tokenUserId: string | undefined,
    @Body()
    data: { bookingId?: string; rating?: number; comment?: string } = {},
  ) {
    return this.mentorsService.reviewMentor(resolveUserId(tokenUserId), {
      bookingId: data.bookingId ?? '',
      rating: data.rating ?? 0,
      comment: data.comment,
    });
  }
}

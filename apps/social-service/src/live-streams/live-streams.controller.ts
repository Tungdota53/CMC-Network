import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, VerifiedUserGuard } from '@campus-connect/common';
import { CreateLiveStreamDto } from './dto/create-live-stream.dto';
import { LiveStreamsService } from './live-streams.service';

@Controller('posts/live-streams')
export class LiveStreamsController {
  constructor(private readonly streams: LiveStreamsService) {}

  @Get('active')
  listActive() { return this.streams.listActive(); }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) { return this.streams.getById(id); }

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  create(@CurrentUser('sub') userId: string, @Body() body: CreateLiveStreamDto) {
    return this.streams.create(userId, body);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  end(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role?: string,
  ) { return this.streams.end(id, userId, role); }
}
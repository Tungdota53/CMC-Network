import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '@campus-connect/common';
import { ReputationService } from './reputation.service';

@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.reputationService.getLeaderboard(limit ? Number(limit) : 20);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyReputation(@CurrentUser('sub') tokenUserId: string | undefined) {
    return this.reputationService.getUserReputation(tokenUserId ?? '');
  }

  @Get(':userId')
  async getUserReputation(@Param('userId') userId: string) {
    return this.reputationService.getUserReputation(userId);
  }

  @Get(':userId/history')
  async getHistory(@Param('userId') userId: string) {
    return this.reputationService.getHistory(userId);
  }

  @Post(':userId/award')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async addPoints(
    @Param('userId') userId: string,
    @Body() body: { action?: string; reason?: string } = {},
  ) {
    return this.reputationService.addPoints(
      userId,
      body.action ?? '',
      body.reason,
    );
  }

  @Post(':userId/badge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async awardBadge(
    @Param('userId') userId: string,
    @Body() body: { badge?: string } = {},
  ) {
    return this.reputationService.awardBadge(userId, body.badge ?? '');
  }
}

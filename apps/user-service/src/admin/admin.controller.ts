import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  resolveUserId,
} from '@campus-connect/common';
import { AdminService } from './admin.service';

/**
 * Admin analytics + moderation. Protected by JwtAuthGuard + RolesGuard.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  async analytics() {
    return this.adminService.getAnalytics();
  }

  @Get('growth')
  async growth(@Query('days') days?: string) {
    return this.adminService.getGrowth(days ? Number(days) : 14);
  }

  @Get('reports')
  async listReports(@Query('status') status?: string) {
    return this.adminService.listReports(status);
  }

  @Put('reports/:id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @Body() body: { status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED' },
  ) {
    return this.adminService.resolveReport(id, body.status);
  }

  @Delete('content/:targetType/:targetId')
  async deleteContent(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.adminService.deleteContent(targetType.toUpperCase(), targetId);
  }
}

/** Public-facing report submission (any authenticated user can report). */
@Controller('reports')
export class ReportsController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async create(
    @CurrentUser('sub') tokenUserId: string,
    @Body()
    body: {
      reporterId?: string;
      targetId: string;
      targetType: string;
      reason: string;
    },
  ) {
    return this.adminService.createReport(
      resolveUserId(tokenUserId, body.reporterId),
      body,
    );
  }
}

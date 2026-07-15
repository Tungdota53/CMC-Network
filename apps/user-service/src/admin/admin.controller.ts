import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  VerifiedUserGuard,
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
  async listReports(
    @Query('status') status?: string,
    @Query('targetType') targetType?: string,
    @Query('q') q?: string,
  ) {
    return this.adminService.listReports({
      status: status === 'ALL' ? undefined : status,
      targetType: targetType === 'ALL' ? undefined : targetType,
      q,
    });
  }

  @Get('audit-logs')
  async auditLogs(@Query('limit') limit?: string) {
    return this.adminService.listAuditLogs(limit ? Number(limit) : 50);
  }

  @Put('reports/:id/resolve')
  async resolveReport(
    @CurrentUser('sub') actorId: string,
    @Param('id') id: string,
    @Body()
    body: {
      status?: 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
      note?: string;
    } = {},
  ) {
    return this.adminService.resolveReport(
      actorId,
      id,
      body.status ?? 'REVIEWED',
      body.note,
    );
  }

  @Delete('content/:targetType/:targetId')
  async deleteContent(
    @CurrentUser('sub') actorId: string,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.adminService.deleteContent(
      actorId,
      targetType.toUpperCase(),
      targetId,
    );
  }

  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listUsers({ search, role });
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'BANNED' | 'PENDING' },
  ) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Patch('users/:id/badge')
  async toggleBlueBadge(@Param('id') id: string) {
    return this.adminService.toggleBlueBadge(id);
  }
}

/** Public-facing report submission (any authenticated user can report). */
@Controller('reports')
@UseGuards(JwtAuthGuard, VerifiedUserGuard)
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
    } = { targetId: '', targetType: '', reason: '' },
  ) {
    return this.adminService.createReport(tokenUserId, body);
  }
}

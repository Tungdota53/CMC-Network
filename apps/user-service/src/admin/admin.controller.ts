import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { CurrentUser, resolveUserId } from '@campus-connect/common';
import { AdminService } from './admin.service';

/**
 * Admin analytics + moderation.
 *
 * NOTE: during the backward-compat window the service runs with optionalAuth,
 * so these routes are not yet hard-gated by RolesGuard. Once the frontend
 * sends admin JWTs, switch the service to enableAuth:true and add
 * @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('ADMIN') here.
 */
@Controller('admin')
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
    @Body() body: { reporterId?: string; targetId: string; targetType: string; reason: string },
  ) {
    return this.adminService.createReport(resolveUserId(tokenUserId, body.reporterId), body);
  }
}

import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { PlatformAdminService } from './platform-admin.service';
import { AuditService } from '../audit/audit.service';

@ApiTags('platform-admin')
@Controller('platform-admin')
@UseGuards(AuthGuard, AdminGuard)
export class PlatformAdminController {
  constructor(
    private platformAdminService: PlatformAdminService,
    private auditService: AuditService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get platform dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboard() {
    const stats = await this.platformAdminService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent platform activity' })
  @ApiResponse({ status: 200, description: 'Activity retrieved successfully' })
  async getActivity(@Query('limit') limit?: string) {
    const activity = await this.platformAdminService.getRecentActivity(limit ? parseInt(limit, 10) : 50);
    return { success: true, data: activity };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get platform audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs() {
    const logs = await this.auditService.getPlatformLogs(100);
    return { success: true, data: logs };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all platform users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query('search') search?: string) {
    const users = await this.platformAdminService.getUsers(search);
    return { success: true, data: users };
  }

  @Post('users')
  @ApiOperation({ summary: 'Create user (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(
    @Body()
    body: {
      name: string;
      email: string;
      password?: string;
      role?: 'SUPER_ADMIN' | 'MEMBER';
      teamId?: string;
      teamRole?: 'TEAM_LEAD' | 'TEAM_MEMBER';
    },
  ) {
    const user = await this.platformAdminService.createUser(body);
    return { success: true, data: user };
  }

  @Delete('users/:userId')
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('userId') userId: string) {
    await this.platformAdminService.deleteUser(userId);
    return { success: true };
  }

  @Get('users/:userId/profile')
  @ApiOperation({ summary: 'Get full user profile across all teams' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getUserProfile(@Param('userId') userId: string) {
    const profile = await this.platformAdminService.getUserProfile(userId);
    return { success: true, data: profile };
  }
}

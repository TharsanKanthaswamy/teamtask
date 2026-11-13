import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly tenantService: TenantService,
  ) {}

  @Get('global')
  async getGlobalAnalytics(@CurrentUser() user: any) {
    // Only Super Admins can access global analytics
    if (!user.isAdmin) {
      throw new ForbiddenException('Only Super Admins can access global analytics');
    }

    const analytics = await this.analyticsService.getGlobalAnalytics();

    return {
      success: true,
      data: analytics,
    };
  }

  @Get('teams/:teamId')
  async getTeamAnalytics(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context (ensures user has access to this team)
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can access team analytics
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new ForbiddenException('Only Team Leads and Super Admins can access team analytics');
    }

    const analytics = await this.analyticsService.getTeamAnalytics(teamId);

    return {
      success: true,
      data: analytics,
    };
  }

  @Get('projects/:projectId')
  async getProjectAnalytics(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    // Get project to determine team
    const project = await this.analyticsService['prisma'].project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      project.teamId,
      user.isAdmin,
    );

    // Team Leads, Project Leads, and Super Admins can access project analytics
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException(
          'Only Team Leads, Project Leads, and Super Admins can access project analytics',
        );
      }
    }

    const analytics = await this.analyticsService.getProjectAnalytics(projectId);

    return {
      success: true,
      data: analytics,
    };
  }

  @Get('members/:userId')
  async getMemberAnalytics(
    @Param('userId') targetUserId: string,
    @Query('teamId') teamId: string | undefined,
    @CurrentUser() user: any,
  ) {
    // Users can view their own analytics
    // Team Leads and Super Admins can view team member analytics
    if (user.userId !== targetUserId && !user.isAdmin) {
      // If teamId is provided, check if current user is Team Lead
      if (teamId) {
        const context = await this.tenantService.resolveTenantContext(
          user.userId,
          teamId,
          user.isAdmin,
        );

        if (context.role !== 'TEAM_LEAD') {
          throw new ForbiddenException('Only Team Leads can view other members\' analytics');
        }
      } else {
        throw new ForbiddenException('You can only view your own analytics');
      }
    }

    const analytics = await this.analyticsService.getMemberAnalytics(
      targetUserId,
      teamId,
    );

    return {
      success: true,
      data: analytics,
    };
  }

  @Get('me')
  async getMyAnalytics(@CurrentUser() user: any) {
    const analytics = await this.analyticsService.getMemberAnalytics(user.userId);

    return {
      success: true,
      data: analytics,
    };
  }
}

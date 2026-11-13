import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { PrismaService } from '../database/prisma.service';

@Controller('teams/:teamId/projects/:projectId/activity')
@UseGuards(AuthGuard)
export class ProjectsActivityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  @Get()
  async getProjectActivity(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @CurrentUser() user?: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const activities = await this.prisma.auditLog.findMany({
      where: {
        teamId,
        entityId: projectId,
        action: {
          in: [
            'CREATE_PROJECT',
            'UPDATE_PROJECT',
            'ARCHIVE_PROJECT',
            'ASSIGN_PROJECT_LEAD',
            'ADD_PROJECT_MEMBER',
            'REMOVE_PROJECT_MEMBER',
            'CREATE_MILESTONE',
            'UPDATE_MILESTONE',
            'DELETE_MILESTONE',
          ],
        },
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit || 50,
    });

    return {
      success: true,
      data: activities,
    };
  }
}

import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface TenantContext {
  teamId: string;
  role: 'TEAM_LEAD' | 'TEAM_MEMBER';
  userId: string;
}

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve team membership and establish tenant context
   * This is the critical tenant isolation function
   */
  async resolveTenantContext(
    userId: string,
    teamId: string,
    isSuperAdmin: boolean = false,
  ): Promise<TenantContext> {
    // Super Admin can access any team
    if (isSuperAdmin) {
      await this.prisma.setTenantContext(teamId, true);
      return {
        teamId,
        role: 'TEAM_LEAD', // Super Admin has full access
        userId,
      };
    }

    // Verify user has active membership in this team
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        teamId,
        status: 'ACTIVE',
        team: {
          status: 'ACTIVE',
        },
      },
      include: {
        team: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this team');
    }

    // Set tenant context in database for RLS
    await this.prisma.setTenantContext(teamId, false);

    return {
      teamId: membership.teamId,
      role: membership.role,
      userId,
    };
  }

  /**
   * Get all team memberships for a user
   */
  async getUserTeams(userId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        team: {
          status: 'ACTIVE',
        },
      },
      include: {
        team: true,
      },
    });

    return memberships.map((m) => ({
      teamId: m.team.id,
      teamName: m.team.name,
      teamSlug: m.team.slug,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Verify user has specific role in team
   */
  async verifyRole(
    userId: string,
    teamId: string,
    requiredRole: 'TEAM_LEAD' | 'TEAM_MEMBER',
  ): Promise<boolean> {
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        teamId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return false;
    }

    if (requiredRole === 'TEAM_LEAD') {
      return membership.role === 'TEAM_LEAD';
    }

    return true; // TEAM_MEMBER can access TEAM_MEMBER-level resources
  }

  /**
   * Check if user is the project lead for a specific project
   */
  async isProjectLead(userId: string, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectLead: true,
      },
    });

    return project?.projectLead?.userId === userId;
  }

  /**
   * Check if user is assigned to a specific task
   */
  async isTaskAssignee(userId: string, taskId: string): Promise<boolean> {
    const assignment = await this.prisma.taskAssignee.findFirst({
      where: {
        taskId,
        status: 'ACTIVE',
        teamMember: {
          userId,
          status: 'ACTIVE',
        },
      },
    });

    return !!assignment;
  }
}

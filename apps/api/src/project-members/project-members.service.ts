import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async addMember(
    projectId: string,
    params: {
      teamMemberId?: string;
      userId?: string;
      email?: string;
      responsibility?: string;
    },
    adderId: string,
  ) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let teamMember: any = null;

    if (params.teamMemberId) {
      teamMember = await this.prisma.teamMember.findFirst({
        where: {
          id: params.teamMemberId,
          teamId: project.teamId,
          status: 'ACTIVE',
        },
        include: { user: true },
      });

      if (!teamMember) {
        throw new BadRequestException(
          'Team member must be an active member of the project\'s team',
        );
      }
    } else if (params.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      teamMember = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: project.teamId, userId: user.id },
        },
        include: { user: true },
      });

      if (!teamMember) {
        // Automatically add user to team
        teamMember = await this.prisma.teamMember.create({
          data: {
            teamId: project.teamId,
            userId: user.id,
            role: 'TEAM_MEMBER',
            status: 'ACTIVE',
          },
          include: { user: true },
        });
      }
    } else if (params.email) {
      const normalizedEmail = params.email.toLowerCase().trim();
      let user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        // Auto-provision user account with email
        user = await this.prisma.user.create({
          data: {
            name: normalizedEmail.split('@')[0],
            email: normalizedEmail,
            status: 'ACTIVE',
          },
        });
      }

      teamMember = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: project.teamId, userId: user.id },
        },
        include: { user: true },
      });

      if (!teamMember) {
        teamMember = await this.prisma.teamMember.create({
          data: {
            teamId: project.teamId,
            userId: user.id,
            role: 'TEAM_MEMBER',
            status: 'ACTIVE',
          },
          include: { user: true },
        });
      }
    } else {
      throw new BadRequestException('Either teamMemberId, userId, or email must be provided');
    }

    // Check if already a member of this project
    const existing = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        teamMemberId: teamMember.id,
      },
    });

    if (existing) {
      throw new ConflictException(`User (${teamMember.user.email}) is already a member of this project`);
    }

    // Add member
    const member = await this.prisma.projectMember.create({
      data: {
        teamId: project.teamId,
        projectId,
        teamMemberId: teamMember.id,
        responsibility: params.responsibility,
        status: 'ACTIVE',
      },
      include: {
        teamMember: {
          include: { user: true },
        },
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: adderId,
      action: 'ADD_PROJECT_MEMBER',
      entityType: 'ProjectMember',
      entityId: member.id,
      teamId: project.teamId,
      metadata: {
        projectId,
        teamMemberId: teamMember.id,
        userName: teamMember.user.name,
        userEmail: teamMember.user.email,
        responsibility: params.responsibility,
      },
    });

    return member;
  }

  async getAvailableUsers(projectId: string, teamId: string) {
    // 1. Current project member user IDs
    const currentMembers = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: { teamMember: { select: { userId: true } } },
    });
    const projectUserIds = new Set(currentMembers.map((m) => m.teamMember.userId));

    // 2. Team members in this team
    const teamMembers = await this.prisma.teamMember.findMany({
      where: { teamId, status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, status: true } },
      },
    });
    const teamUserIds = new Set(teamMembers.map((tm) => tm.userId));

    // 3. All platform users
    const allUsers = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, email: true, avatarUrl: true, status: true, platformAdmin: true },
      orderBy: { createdAt: 'desc' },
    });

    // Available team members (not yet in this project)
    const availableTeamMembers = teamMembers
      .filter((tm) => !projectUserIds.has(tm.userId))
      .map((tm) => ({
        type: 'TEAM_MEMBER' as const,
        teamMemberId: tm.id,
        userId: tm.userId,
        name: tm.user.name,
        email: tm.user.email,
        avatarUrl: tm.user.avatarUrl,
        role: tm.role,
      }));

    // Other registered users across the platform (new accounts not yet in this team)
    const otherUsers = allUsers
      .filter((u) => !projectUserIds.has(u.id) && !teamUserIds.has(u.id))
      .map((u) => ({
        type: 'NEW_USER' as const,
        userId: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        isAdmin: !!u.platformAdmin?.enabled,
        role: u.platformAdmin?.enabled ? 'SUPER_ADMIN' : 'REGISTERED_USER',
      }));

    return {
      teamMembers: availableTeamMembers,
      otherUsers: otherUsers,
    };
  }

  async removeMember(
    projectId: string,
    memberId: string,
    removerId: string,
  ): Promise<void> {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        teamMember: { include: { user: true } },
        project: true,
      },
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Project member not found');
    }

    // Check if this is the project lead
    if (member.project.projectLeadId === member.teamMemberId) {
      throw new BadRequestException(
        'Cannot remove project lead. Assign a new lead first.',
      );
    }

    // Remove member
    await this.prisma.projectMember.delete({
      where: { id: memberId },
    });

    // Log audit event
    await this.auditService.log({
      actorId: removerId,
      action: 'REMOVE_PROJECT_MEMBER',
      entityType: 'ProjectMember',
      entityId: memberId,
      teamId: member.teamId,
      metadata: {
        projectId,
        teamMemberId: member.teamMemberId,
        userName: member.teamMember.user.name,
      },
    });
  }

  async getProjectMembers(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      include: {
        teamMember: {
          include: { user: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberResponsibility(
    memberId: string,
    responsibility: string,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    const updated = await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { responsibility },
      include: {
        teamMember: {
          include: { user: true },
        },
      },
    });

    return updated;
  }
}

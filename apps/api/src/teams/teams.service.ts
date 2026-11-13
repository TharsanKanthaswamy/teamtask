import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createTeam(
    name: string,
    slug: string,
    description: string | null,
    creatorId: string,
  ) {
    // Check if slug already exists
    const existing = await this.prisma.team.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Team slug already exists');
    }

    const team = await this.prisma.team.create({
      data: {
        name,
        slug,
        description,
        status: 'ACTIVE',
      },
    });

    await this.auditService.log({
      actorId: creatorId,
      action: 'CREATE_TEAM',
      entityType: 'Team',
      entityId: team.id,
      metadata: { teamName: name, slug },
    });

    return team;
  }

  async getTeamById(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const leadCount = team.members.filter((m) => m.role === 'TEAM_LEAD').length;
    const memberCount = team.members.length;

    return {
      ...team,
      leadCount,
      memberCount,
    };
  }

  async listTeams() {
    const teams = await this.prisma.team.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return teams.map((team) => ({
      ...team,
      leadCount: team.members.filter((m) => m.role === 'TEAM_LEAD').length,
      memberCount: team.members.length,
    }));
  }

  async updateTeam(
    teamId: string,
    data: { name?: string; description?: string },
    updaterId: string,
  ) {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data,
    });

    await this.auditService.log({
      actorId: updaterId,
      action: 'UPDATE_TEAM',
      entityType: 'Team',
      entityId: teamId,
      teamId,
      metadata: { updates: data },
    });

    return team;
  }

  async updateTeamStatus(
    teamId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    updaterId: string,
  ) {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: { status },
    });

    await this.auditService.log({
      actorId: updaterId,
      action: 'DEACTIVATE_TEAM',
      entityType: 'Team',
      entityId: teamId,
      teamId,
      metadata: { newStatus: status },
    });

    return team;
  }

  async addMember(
    teamId: string,
    userId: string,
    role: 'TEAM_LEAD' | 'TEAM_MEMBER',
    adderId: string,
  ) {
    // Check if user already in team
    const existing = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this team');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
        status: 'ACTIVE',
      },
      include: {
        user: true,
      },
    });

    await this.auditService.log({
      actorId: adderId,
      action: 'ADD_MEMBER',
      entityType: 'TeamMember',
      entityId: member.id,
      teamId,
      metadata: { userId, role, userName: user.name },
    });

    return member;
  }

  async removeMember(teamId: string, memberId: string, removerId: string): Promise<void> {
    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.teamId !== teamId) {
      throw new NotFoundException('Team member not found');
    }

    await this.prisma.teamMember.delete({
      where: { id: memberId },
    });

    await this.auditService.log({
      actorId: removerId,
      action: 'REMOVE_MEMBER',
      entityType: 'TeamMember',
      entityId: memberId,
      teamId,
      metadata: { userId: member.userId, userName: member.user.name },
    });
  }

  async assignTeamLead(teamId: string, userId: string, assignerId: string): Promise<void> {
    // Start a transaction to ensure only one lead
    await this.prisma.$transaction(async (tx) => {
      // Remove existing lead
      await tx.teamMember.updateMany({
        where: {
          teamId,
          role: 'TEAM_LEAD',
        },
        data: {
          role: 'TEAM_MEMBER',
        },
      });

      // Assign new lead
      const member = await tx.teamMember.updateMany({
        where: {
          teamId,
          userId,
        },
        data: {
          role: 'TEAM_LEAD',
        },
      });

      if (member.count === 0) {
        throw new NotFoundException('User is not a member of this team');
      }
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    await this.auditService.log({
      actorId: assignerId,
      action: 'ASSIGN_LEAD',
      entityType: 'TeamMember',
      entityId: userId,
      teamId,
      metadata: { userId, userName: user?.name },
    });
  }

  async getTeamMembers(teamId: string) {
    return this.prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: true,
      },
      orderBy: [
        { role: 'desc' }, // Team Lead first
        { joinedAt: 'asc' },
      ],
    });
  }

  async getMemberProfile(teamId: string, memberId: string) {
    const member = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        OR: [
          { id: memberId },
          { userId: memberId },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
            platformAdmin: {
              select: { adminLevel: true, enabled: true },
            },
            teamMembers: {
              include: {
                team: {
                  select: { id: true, name: true, slug: true, status: true },
                },
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            status: true,
          },
        },
        ledProjects: {
          where: { archivedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            priority: true,
            targetEndDate: true,
            createdAt: true,
          },
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                priority: true,
                targetEndDate: true,
              },
            },
          },
        },
        taskAssignees: {
          where: { status: 'ACTIVE' },
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                project: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const contributions = await this.prisma.contributionLog.findMany({
      where: { submittedBy: member.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        taskAssignee: {
          include: {
            task: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    const totalHours = contributions.reduce((acc, c) => acc + (c.hoursSpent || 0), 0);
    const completedTasks = member.taskAssignees.filter(
      (ta) => ta.task?.status === 'COMPLETED'
    ).length;
    const activeTasks = member.taskAssignees.filter(
      (ta) => ta.task?.status !== 'COMPLETED' && ta.task?.status !== 'CANCELLED'
    ).length;

    return {
      member: {
        id: member.id,
        teamId: member.teamId,
        userId: member.userId,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
      },
      user: member.user,
      team: member.team,
      teams: member.user.teamMembers.map((tm) => ({
        id: tm.id,
        role: tm.role,
        team: tm.team,
        joinedAt: tm.joinedAt,
      })),
      ledProjects: member.ledProjects,
      participatingProjects: member.projectMembers.map((pm) => ({
        id: pm.id,
        responsibility: pm.responsibility,
        joinedAt: pm.joinedAt,
        project: pm.project,
      })),
      tasks: member.taskAssignees.map((ta) => ta.task),
      stats: {
        totalTasks: member.taskAssignees.length,
        activeTasks,
        completedTasks,
        totalHoursLogged: totalHours,
        contributionsCount: contributions.length,
      },
      recentContributions: contributions.map((c) => ({
        id: c.id,
        progressPercent: c.progressPercent,
        hoursSpent: c.hoursSpent,
        description: c.description,
        evidenceUrl: c.evidenceUrl,
        createdAt: c.createdAt,
        taskTitle: c.taskAssignee?.task?.title,
      })),
    };
  }
}

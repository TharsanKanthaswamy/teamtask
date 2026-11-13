import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class PlatformAdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalTeams, totalUsers, activeTeams, recentActivity] = await Promise.all([
      this.prisma.team.count({
        where: { deletedAt: null },
      }),
      this.prisma.user.count(),
      this.prisma.team.count({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      totalTeams,
      totalUsers,
      activeTeams,
      recentActivity,
    };
  }

  async getRecentActivity(limit: number = 50) {
    return this.prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUsers(search?: string) {
    const where: any = {};
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        platformAdmin: {
          select: { adminLevel: true, enabled: true },
        },
        teamMembers: {
          select: {
            id: true,
            role: true,
            team: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: {
    name: string;
    email: string;
    password?: string;
    role?: 'SUPER_ADMIN' | 'MEMBER';
    teamId?: string;
    teamRole?: 'TEAM_LEAD' | 'TEAM_MEMBER';
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const rawPassword = data.password || 'Welcome@123';
    const passwordHash = await argon2.hash(rawPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        status: 'ACTIVE',
      },
    });

    if (data.role === 'SUPER_ADMIN') {
      await this.prisma.platformAdmin.create({
        data: {
          userId: user.id,
          adminLevel: 'SUPER_ADMIN',
          enabled: true,
        },
      });
    }

    if (data.teamId) {
      await this.prisma.teamMember.create({
        data: {
          teamId: data.teamId,
          userId: user.id,
          role: data.teamRole || 'TEAM_MEMBER',
          status: 'ACTIVE',
        },
      });
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        platformAdmin: true,
        teamMembers: { include: { team: true } },
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { platformAdmin: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.platformAdmin) {
      const adminCount = await this.prisma.platformAdmin.count({
        where: { enabled: true },
      });
      if (adminCount <= 1) {
        throw new ConflictException('Cannot delete the last platform administrator');
      }
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        platformAdmin: true,
        teamMembers: {
          include: {
            team: true,
            ledProjects: {
              where: { archivedAt: null },
            },
            projectMembers: {
              include: { project: true },
            },
            taskAssignees: {
              where: { status: 'ACTIVE' },
              include: {
                task: {
                  include: { project: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const contributions = await this.prisma.contributionLog.findMany({
      where: { submittedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        taskAssignee: {
          include: {
            task: true,
          },
        },
      },
    });

    const allTasks = user.teamMembers.flatMap((tm) => tm.taskAssignees.map((ta) => ta.task));
    const allLedProjects = user.teamMembers.flatMap((tm) => tm.ledProjects);
    const allParticipating = user.teamMembers.flatMap((tm) => tm.projectMembers);
    const totalHours = contributions.reduce((acc, c) => acc + (c.hoursSpent || 0), 0);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        status: user.status,
        createdAt: user.createdAt,
        platformAdmin: user.platformAdmin,
      },
      member: {
        role: user.platformAdmin ? 'SUPER_ADMIN' : 'TEAM_MEMBER',
        status: user.status,
        joinedAt: user.createdAt,
      },
      teams: user.teamMembers.map((tm) => ({
        id: tm.id,
        role: tm.role,
        team: tm.team,
        joinedAt: tm.joinedAt,
      })),
      ledProjects: allLedProjects,
      participatingProjects: allParticipating.map((pm) => ({
        id: pm.id,
        responsibility: pm.responsibility,
        project: pm.project,
      })),
      tasks: allTasks,
      stats: {
        totalTasks: allTasks.length,
        activeTasks: allTasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
        completedTasks: allTasks.filter((t: any) => t.status === 'COMPLETED').length,
        totalHoursLogged: totalHours,
        contributionsCount: contributions.length,
      },
      recentContributions: contributions.map((c) => ({
        id: c.id,
        progressPercent: c.progressPercent,
        hoursSpent: c.hoursSpent,
        description: c.description,
        createdAt: c.createdAt,
        taskTitle: c.taskAssignee?.task?.title,
      })),
    };
  }
}

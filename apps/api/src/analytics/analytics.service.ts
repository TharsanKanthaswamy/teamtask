import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProgressCalculationService } from '../progress/progress-calculation.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressCalculationService,
  ) {}

  /**
   * Get global analytics (Super Admin only)
   */
  async getGlobalAnalytics() {
    const [
      totalTeams,
      totalUsers,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      pendingReviews,
    ] = await Promise.all([
      this.prisma.team.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count({ where: { status: 'COMPLETED' } }),
      this.prisma.task.count({ where: { status: { not: 'CANCELLED' } } }),
      this.prisma.task.count({ where: { status: 'COMPLETED' } }),
      this.prisma.task.count({
        where: {
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      this.prisma.taskReview.count({ where: { status: 'PENDING' } }),
    ]);

    // Get top performing teams
    const teams = await this.prisma.team.findMany({
      where: { status: 'ACTIVE' },
      take: 10,
    });

    const teamPerformance = await Promise.all(
      teams.map(async (team) => {
        const progress = await this.progressService.calculateTeamProgress(team.id);
        return {
          teamId: team.id,
          teamName: team.name,
          completionRate: progress.averageProjectCompletion,
          totalProjects: progress.totalProjects,
          completedProjects: progress.completedProjects,
        };
      }),
    );

    teamPerformance.sort((a, b) => b.completionRate - a.completionRate);

    return {
      totalTeams,
      totalUsers,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      pendingReviews,
      averageProjectCompletion:
        teamPerformance.reduce((sum, t) => sum + t.completionRate, 0) /
        (teamPerformance.length || 1),
      topPerformingTeams: teamPerformance.slice(0, 5),
      bottomPerformingTeams: teamPerformance.slice(-5).reverse(),
    };
  }

  /**
   * Get team-level analytics
   */
  async getTeamAnalytics(teamId: string) {
    const [team, teamProgress, members] = await Promise.all([
      this.prisma.team.findUnique({
        where: { id: teamId },
      }),
      this.progressService.calculateTeamProgress(teamId),
      this.prisma.teamMember.findMany({
        where: {
          teamId,
          status: 'ACTIVE',
        },
        include: {
          user: true,
        },
      }),
    ]);

    if (!team) {
      throw new Error('Team not found');
    }

    // Get member performance
    const memberPerformance = await Promise.all(
      members.map(async (member) => {
        const stats = await this.progressService.getMemberOverallStatistics(
          member.userId,
        );
        return {
          memberId: member.id,
          userId: member.userId,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
          tasksAssigned: stats.totalTasks,
          tasksCompleted: stats.completedTasks,
          completionRate:
            stats.totalTasks > 0
              ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
              : 0,
          averageProgress: stats.averageProgress,
          totalHours: stats.totalHoursLogged,
        };
      }),
    );

    return {
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
      },
      progress: teamProgress,
      members: memberPerformance,
      summary: {
        totalMembers: members.length,
        totalTasksAssigned: memberPerformance.reduce(
          (sum, m) => sum + m.tasksAssigned,
          0,
        ),
        totalTasksCompleted: memberPerformance.reduce(
          (sum, m) => sum + m.tasksCompleted,
          0,
        ),
        totalHoursLogged: memberPerformance.reduce(
          (sum, m) => sum + m.totalHours,
          0,
        ),
      },
    };
  }

  /**
   * Get project-level analytics
   */
  async getProjectAnalytics(projectId: string) {
    const [project, projectProgress] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          team: true,
          projectLead: {
            include: { user: true },
          },
        },
      }),
      this.progressService.calculateProjectProgress(projectId),
    ]);

    if (!project) {
      throw new Error('Project not found');
    }

    // Get tasks by status
    const tasksByStatus = await this.prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId,
        status: { not: 'CANCELLED' },
      },
      _count: true,
    });

    // Get tasks by priority
    const tasksByPriority = await this.prisma.task.groupBy({
      by: ['priority'],
      where: {
        projectId,
        status: { not: 'CANCELLED' },
      },
      _count: true,
    });

    // Get overdue tasks
    const overdueTasks = await this.prisma.task.count({
      where: {
        projectId,
        dueDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    // Get contributor performance
    const projectMembers = await this.prisma.projectMember.findMany({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      include: {
        teamMember: {
          include: { user: true },
        },
      },
    });

    const contributorPerformance = await Promise.all(
      projectMembers.map(async (pm) => {
        const contribution = await this.progressService.calculateMemberProjectContribution(
          projectId,
          pm.teamMemberId,
        );
        return {
          memberId: pm.teamMemberId,
          name: pm.teamMember.user.name,
          email: pm.teamMember.user.email,
          tasksAssigned: contribution.tasksCount,
          approvedCompletion: contribution.approvedCompletion,
          reportedCompletion: contribution.reportedCompletion,
        };
      }),
    );

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        priority: project.priority,
        teamName: project.team.name,
        projectLeadName: project.projectLead.user.name,
      },
      progress: projectProgress,
      taskBreakdown: {
        byStatus: tasksByStatus.reduce(
          (acc, item) => ({
            ...acc,
            [item.status]: item._count,
          }),
          {},
        ),
        byPriority: tasksByPriority.reduce(
          (acc, item) => ({
            ...acc,
            [item.priority]: item._count,
          }),
          {},
        ),
        overdue: overdueTasks,
      },
      contributors: contributorPerformance,
    };
  }

  /**
   * Get individual member analytics
   */
  async getMemberAnalytics(userId: string, teamId?: string) {
    const overallStats = await this.progressService.getMemberOverallStatistics(
      userId,
    );

    // Get team memberships
    const memberships = await this.prisma.teamMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        ...(teamId ? { teamId } : {}),
      },
      include: {
        team: true,
      },
    });

    // Get active tasks
    const activeTasks = await this.prisma.taskAssignee.findMany({
      where: {
        teamMember: {
          userId,
          status: 'ACTIVE',
        },
        status: 'ACTIVE',
        task: {
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        task: {
          dueDate: 'asc',
        },
      },
    });

    // Get recent contributions
    const recentContributions = await this.prisma.contributionLog.findMany({
      where: {
        submittedBy: userId,
      },
      include: {
        taskAssignee: {
          include: {
            task: {
              include: {
                project: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Calculate on-time completion rate
    const completedTasks = await this.prisma.taskAssignee.findMany({
      where: {
        teamMember: {
          userId,
          status: 'ACTIVE',
        },
        task: {
          status: 'COMPLETED',
        },
      },
      include: {
        task: true,
      },
    });

    const onTimeCount = completedTasks.filter((ta) => {
      if (!ta.task.dueDate) return true;
      return ta.task.updatedAt <= ta.task.dueDate;
    }).length;

    const onTimeRate =
      completedTasks.length > 0
        ? Math.round((onTimeCount / completedTasks.length) * 100)
        : 0;

    return {
      overallStatistics: overallStats,
      teams: memberships.map((m) => ({
        teamId: m.teamId,
        teamName: m.team.name,
        role: m.role,
      })),
      activeTasks: activeTasks.map((ta) => ({
        taskId: ta.taskId,
        taskTitle: ta.task.title,
        projectName: ta.task.project.name,
        allocatedWeight: ta.allocatedWeight,
        reportedProgress: ta.reportedProgress,
        approvedProgress: ta.approvedProgress,
        dueDate: ta.task.dueDate,
      })),
      recentContributions: recentContributions.map((c) => ({
        id: c.id,
        taskTitle: c.taskAssignee.task.title,
        projectName: c.taskAssignee.task.project.name,
        progressPercent: c.progressPercent,
        hoursSpent: c.hoursSpent,
        createdAt: c.createdAt,
      })),
      performance: {
        completionRate:
          overallStats.totalTasks > 0
            ? Math.round(
                (overallStats.completedTasks / overallStats.totalTasks) * 100,
              )
            : 0,
        onTimeRate,
      },
    };
  }
}

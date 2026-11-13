import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ProgressCalculationService } from '../progress/progress-calculation.service';

@Injectable()
export class ReportingService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
    private progressService: ProgressCalculationService,
  ) {}

  /**
   * Convert object array to CSV format
   */
  private objectArrayToCSV(data: any[], headers: string[]): string {
    if (data.length === 0) return '';

    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape commas and quotes
        const escaped = String(value ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Generate team performance report
   */
  async generateTeamReport(
    teamId: string,
    _startDate?: Date,
    _endDate?: Date,
  ): Promise<{ csv: string; json: any }> {
    const analytics = await this.analyticsService.getTeamAnalytics(teamId);

    // Prepare data
    const reportData = analytics.members.map((member) => ({
      Name: member.name,
      Email: member.email,
      Role: member.role,
      'Tasks Assigned': member.tasksAssigned,
      'Tasks Completed': member.tasksCompleted,
      'Completion Rate': `${member.completionRate}%`,
      'Average Progress': `${member.averageProgress}%`,
      'Total Hours': member.totalHours,
    }));

    // Add summary row
    const summaryData = {
      Name: '--- SUMMARY ---',
      Email: analytics.team.name,
      Role: 'Team',
      'Tasks Assigned': analytics.summary.totalTasksAssigned,
      'Tasks Completed': analytics.summary.totalTasksCompleted,
      'Completion Rate': `${Math.round((analytics.summary.totalTasksCompleted / analytics.summary.totalTasksAssigned) * 100)}%`,
      'Average Progress': `${analytics.progress.averageProjectCompletion}%`,
      'Total Hours': analytics.summary.totalHoursLogged,
    };

    const allData = [...reportData, summaryData];

    const csv = this.objectArrayToCSV(allData, [
      'Name',
      'Email',
      'Role',
      'Tasks Assigned',
      'Tasks Completed',
      'Completion Rate',
      'Average Progress',
      'Total Hours',
    ]);

    return {
      csv,
      json: {
        team: analytics.team,
        members: reportData,
        summary: analytics.summary,
        progress: analytics.progress,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate project completion report
   */
  async generateProjectReport(
    projectId: string,
    _startDate?: Date,
    _endDate?: Date,
  ): Promise<{ csv: string; json: any }> {
    const analytics = await this.analyticsService.getProjectAnalytics(projectId);

    // Prepare contributor data
    const contributorData = analytics.contributors.map((contributor) => ({
      Name: contributor.name,
      Email: contributor.email,
      'Tasks Assigned': contributor.tasksAssigned,
      'Reported Progress': `${contributor.reportedCompletion}%`,
      'Approved Progress': `${contributor.approvedCompletion}%`,
    }));

    // Add project summary
    const projectSummary = {
      Name: '--- PROJECT SUMMARY ---',
      Email: analytics.project.name,
      'Tasks Assigned': analytics.progress.totalTasks,
      'Reported Progress': `${analytics.progress.reportedProgress}%`,
      'Approved Progress': `${analytics.progress.approvedProgress}%`,
    };

    const allData = [...contributorData, projectSummary];

    const csv = this.objectArrayToCSV(allData, [
      'Name',
      'Email',
      'Tasks Assigned',
      'Reported Progress',
      'Approved Progress',
    ]);

    return {
      csv,
      json: {
        project: analytics.project,
        progress: analytics.progress,
        taskBreakdown: analytics.taskBreakdown,
        contributors: contributorData,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate individual contribution report
   */
  async generateMemberReport(
    userId: string,
    teamId?: string,
    _startDate?: Date,
    _endDate?: Date,
  ): Promise<{ csv: string; json: any }> {
    const analytics = await this.analyticsService.getMemberAnalytics(
      userId,
      teamId,
    );

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Prepare active tasks data
    const tasksData = analytics.activeTasks.map((task) => ({
      Project: task.projectName,
      Task: task.taskTitle,
      'Allocated Weight': `${task.allocatedWeight}%`,
      'Reported Progress': `${task.reportedProgress}%`,
      'Approved Progress': `${task.approvedProgress}%`,
      'Due Date': task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : 'Not set',
    }));

    // Add summary
    const summary = {
      Project: '--- SUMMARY ---',
      Task: user?.name || 'Member',
      'Allocated Weight': `${analytics.activeTasks.length} tasks`,
      'Reported Progress': `Completed: ${analytics.overallStatistics.completedTasks}`,
      'Approved Progress': `Total Hours: ${analytics.overallStatistics.totalHoursLogged}`,
      'Due Date': `On-Time Rate: ${analytics.performance.onTimeRate}%`,
    };

    const allData = [...tasksData, summary];

    const csv = this.objectArrayToCSV(allData, [
      'Project',
      'Task',
      'Allocated Weight',
      'Reported Progress',
      'Approved Progress',
      'Due Date',
    ]);

    return {
      csv,
      json: {
        member: {
          userId: user?.id,
          name: user?.name,
          email: user?.email,
        },
        statistics: analytics.overallStatistics,
        performance: analytics.performance,
        activeTasks: analytics.activeTasks,
        recentContributions: analytics.recentContributions,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate task completion report
   */
  async generateTasksReport(
    projectId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ csv: string; json: any }> {
    const where: any = {
      projectId,
      status: { not: 'CANCELLED' },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignees: {
          where: { status: 'ACTIVE' },
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate progress for each task
    const tasksWithProgress = await Promise.all(
      tasks.map(async (task) => {
        const progress = await this.progressService.calculateTaskProgress(
          task.id,
        );
        return {
          Title: task.title,
          Status: task.status,
          Priority: task.priority,
          Weight: task.weight,
          'Assignees': task.assignees.map((a) => a.teamMember.user.name).join(', '),
          'Reported Progress': `${progress.reportedProgress}%`,
          'Approved Progress': `${progress.approvedProgress}%`,
          'Due Date': task.dueDate
            ? new Date(task.dueDate).toISOString().split('T')[0]
            : 'Not set',
          Created: new Date(task.createdAt).toISOString().split('T')[0],
        };
      }),
    );

    const csv = this.objectArrayToCSV(tasksWithProgress, [
      'Title',
      'Status',
      'Priority',
      'Weight',
      'Assignees',
      'Reported Progress',
      'Approved Progress',
      'Due Date',
      'Created',
    ]);

    return {
      csv,
      json: {
        tasks: tasksWithProgress,
        summary: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
          inProgressTasks: tasks.filter((t) => t.status === 'IN_PROGRESS')
            .length,
          overdueTasks: tasks.filter(
            (t) =>
              t.dueDate &&
              t.dueDate < new Date() &&
              !['COMPLETED', 'CANCELLED'].includes(t.status),
          ).length,
        },
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate deadline performance report
   */
  async generateDeadlineReport(
    teamId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ csv: string; json: any }> {
    const where: any = {
      teamId,
      status: 'COMPLETED',
      dueDate: { not: null },
    };

    if (startDate || endDate) {
      where.updatedAt = {};
      if (startDate) where.updatedAt.gte = startDate;
      if (endDate) where.updatedAt.lte = endDate;
    }

    const completedTasks = await this.prisma.task.findMany({
      where,
      include: {
        project: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const reportData = completedTasks.map((task) => {
      const onTime = task.updatedAt <= (task.dueDate || new Date());
      const daysDifference = Math.floor(
        (task.updatedAt.getTime() - (task.dueDate?.getTime() || 0)) /
          (1000 * 60 * 60 * 24),
      );

      return {
        Project: task.project.name,
        Task: task.title,
        Priority: task.priority,
        'Due Date': task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : '',
        'Completed Date': new Date(task.updatedAt).toISOString().split('T')[0],
        'On Time': onTime ? 'Yes' : 'No',
        'Days Difference': daysDifference,
      };
    });

    // Calculate statistics
    const onTimeCount = reportData.filter((t) => t['On Time'] === 'Yes').length;
    const onTimeRate = Math.round((onTimeCount / reportData.length) * 100);

    const summary = {
      Project: '--- SUMMARY ---',
      Task: `${reportData.length} tasks`,
      Priority: `On-Time: ${onTimeCount}`,
      'Due Date': `Late: ${reportData.length - onTimeCount}`,
      'Completed Date': `On-Time Rate: ${onTimeRate}%`,
      'On Time': '',
      'Days Difference': '',
    };

    const allData = [...reportData, summary];

    const csv = this.objectArrayToCSV(allData, [
      'Project',
      'Task',
      'Priority',
      'Due Date',
      'Completed Date',
      'On Time',
      'Days Difference',
    ]);

    return {
      csv,
      json: {
        tasks: reportData,
        summary: {
          totalTasks: reportData.length,
          onTimeCount,
          lateCount: reportData.length - onTimeCount,
          onTimeRate,
        },
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

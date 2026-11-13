import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * Progress Calculation Service
 *
 * Implements the mathematical formulas for progress tracking:
 * - Individual Contribution: C_i = W_i × P_i / 100
 * - Task Progress: P_task = SUM(W_i × P_i / 100)
 * - Project Progress: Weighted average based on task weights
 */
@Injectable()
export class ProgressCalculationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate individual contribution points for a task assignee
   *
   * Formula: C_i = W_i × P_i / 100
   *
   * @param allocatedWeight - Weight allocated to this assignee (W_i)
   * @param approvedProgress - Approved progress percentage (P_i)
   * @returns Contribution points (0-100)
   */
  calculateIndividualContribution(
    allocatedWeight: number,
    approvedProgress: number,
  ): number {
    return (allocatedWeight * approvedProgress) / 100;
  }

  /**
   * Calculate verified task progress from all assignees
   *
   * Formula: SUM(W_i × P_i / 100) for all active assignees
   *
   * @param taskId - Task ID
   * @returns Object with reportedProgress and approvedProgress (0-100)
   */
  async calculateTaskProgress(taskId: string): Promise<{
    reportedProgress: number;
    approvedProgress: number;
  }> {
    const assignees = await this.prisma.taskAssignee.findMany({
      where: {
        taskId,
        status: 'ACTIVE',
      },
    });

    if (assignees.length === 0) {
      return { reportedProgress: 0, approvedProgress: 0 };
    }

    const reported = assignees.reduce((sum, assignee) => {
      return sum + this.calculateIndividualContribution(
        assignee.allocatedWeight,
        assignee.reportedProgress,
      );
    }, 0);

    const approved = assignees.reduce((sum, assignee) => {
      return sum + this.calculateIndividualContribution(
        assignee.allocatedWeight,
        assignee.approvedProgress,
      );
    }, 0);

    return {
      reportedProgress: Math.round(reported),
      approvedProgress: Math.round(approved),
    };
  }

  /**
   * Calculate project completion percentage
   *
   * Formula: SUM(task_weight × verified_progress) / SUM(task_weight)
   *
   * Excludes CANCELLED tasks from calculation
   *
   * @param projectId - Project ID
   * @returns Object with progress metrics and task counts
   */
  async calculateProjectProgress(projectId: string): Promise<{
    reportedProgress: number;
    approvedProgress: number;
    totalTasks: number;
    completedTasks: number;
  }> {
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        status: { not: 'CANCELLED' },
      },
      include: {
        assignees: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (tasks.length === 0) {
      return {
        reportedProgress: 0,
        approvedProgress: 0,
        totalTasks: 0,
        completedTasks: 0,
      };
    }

    let totalWeight = 0;
    let weightedReported = 0;
    let weightedApproved = 0;
    let completedCount = 0;

    for (const task of tasks) {
      const progress = await this.calculateTaskProgress(task.id);

      totalWeight += task.weight;
      weightedReported += (task.weight * progress.reportedProgress) / 100;
      weightedApproved += (task.weight * progress.approvedProgress) / 100;

      if (task.status === 'COMPLETED') {
        completedCount++;
      }
    }

    return {
      reportedProgress: totalWeight > 0 ? Math.round((weightedReported / totalWeight) * 100) : 0,
      approvedProgress: totalWeight > 0 ? Math.round((weightedApproved / totalWeight) * 100) : 0,
      totalTasks: tasks.length,
      completedTasks: completedCount,
    };
  }

  /**
   * Calculate individual member's contribution across a project
   *
   * @param projectId - Project ID
   * @param teamMemberId - Team Member ID
   * @returns Object with member's contribution metrics
   */
  async calculateMemberProjectContribution(
    projectId: string,
    teamMemberId: string,
  ): Promise<{
    totalAllocatedWeight: number;
    reportedCompletion: number;
    approvedCompletion: number;
    tasksCount: number;
  }> {
    const assignees = await this.prisma.taskAssignee.findMany({
      where: {
        teamMemberId,
        task: {
          projectId,
          status: { not: 'CANCELLED' },
        },
        status: 'ACTIVE',
      },
      include: {
        task: true,
      },
    });

    if (assignees.length === 0) {
      return {
        totalAllocatedWeight: 0,
        reportedCompletion: 0,
        approvedCompletion: 0,
        tasksCount: 0,
      };
    }

    // Calculate weighted completion
    let totalWeight = 0;
    let reportedSum = 0;
    let approvedSum = 0;

    for (const assignee of assignees) {
      // Weight this assignment by the task weight and allocation percentage
      const weight = assignee.task.weight * (assignee.allocatedWeight / 100);
      totalWeight += weight;
      reportedSum += weight * (assignee.reportedProgress / 100);
      approvedSum += weight * (assignee.approvedProgress / 100);
    }

    return {
      totalAllocatedWeight: assignees.reduce((sum, a) => sum + a.allocatedWeight, 0),
      reportedCompletion: totalWeight > 0 ? Math.round((reportedSum / totalWeight) * 100) : 0,
      approvedCompletion: totalWeight > 0 ? Math.round((approvedSum / totalWeight) * 100) : 0,
      tasksCount: assignees.length,
    };
  }

  /**
   * Calculate team-wide progress across all projects
   *
   * @param teamId - Team ID
   * @returns Object with team-level metrics
   */
  async calculateTeamProgress(teamId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    averageProjectCompletion: number;
    totalTasks: number;
    completedTasks: number;
  }> {
    const projects = await this.prisma.project.findMany({
      where: {
        teamId,
        status: { not: 'ARCHIVED' },
      },
    });

    if (projects.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        averageProjectCompletion: 0,
        totalTasks: 0,
        completedTasks: 0,
      };
    }

    let totalProgress = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let completedProjects = 0;
    let activeProjects = 0;

    for (const project of projects) {
      const progress = await this.calculateProjectProgress(project.id);
      totalProgress += progress.approvedProgress;
      totalTasks += progress.totalTasks;
      completedTasks += progress.completedTasks;

      if (project.status === 'COMPLETED') {
        completedProjects++;
      } else if (project.status === 'ACTIVE') {
        activeProjects++;
      }
    }

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      averageProjectCompletion: Math.round(totalProgress / projects.length),
      totalTasks,
      completedTasks,
    };
  }

  /**
   * Recalculate and update task progress in database
   * Called after review approval
   *
   * @param taskId - Task ID
   */
  async recalculateTaskProgress(taskId: string): Promise<void> {
    const progress = await this.calculateTaskProgress(taskId);

    // Check if all assignees have 100% approved progress
    const assignees = await this.prisma.taskAssignee.findMany({
      where: {
        taskId,
        status: 'ACTIVE',
      },
    });

    const allComplete = assignees.every((a) => a.approvedProgress === 100);

    // If all assignees are at 100% approved, update task status to COMPLETED
    if (allComplete && progress.approvedProgress === 100) {
      await this.prisma.task.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' },
      });
    }
  }

  /**
   * Get member's overall statistics across all teams
   *
   * @param userId - User ID
   * @returns Object with user's overall metrics
   */
  async getMemberOverallStatistics(userId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    totalHoursLogged: number;
    totalContributions: number;
    averageProgress: number;
  }> {
    // Get all team memberships
    const teamMembers = await this.prisma.teamMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    const teamMemberIds = teamMembers.map((tm) => tm.id);

    // Get all task assignments
    const assignments = await this.prisma.taskAssignee.findMany({
      where: {
        teamMemberId: { in: teamMemberIds },
        status: 'ACTIVE',
      },
      include: {
        task: true,
        contributionLogs: true,
      },
    });

    let totalHours = 0;
    let totalContributions = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let progressSum = 0;

    for (const assignment of assignments) {
      // Count contributions and hours
      totalContributions += assignment.contributionLogs.length;
      totalHours += assignment.contributionLogs.reduce(
        (sum, log) => sum + (log.hoursSpent || 0),
        0,
      );

      // Count task status
      if (assignment.task.status === 'COMPLETED') {
        completedCount++;
      } else if (assignment.task.status === 'IN_PROGRESS') {
        inProgressCount++;
      }

      progressSum += assignment.approvedProgress;
    }

    return {
      totalTasks: assignments.length,
      completedTasks: completedCount,
      inProgressTasks: inProgressCount,
      totalHoursLogged: totalHours,
      totalContributions,
      averageProgress: assignments.length > 0 ? Math.round(progressSum / assignments.length) : 0,
    };
  }
}

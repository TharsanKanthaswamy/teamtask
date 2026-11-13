import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { TaskStatus, Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Valid status transitions
   */
  private readonly VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    BACKLOG: ['TODO'],
    TODO: ['IN_PROGRESS', 'BACKLOG'],
    IN_PROGRESS: ['IN_REVIEW', 'TODO', 'BLOCKED'],
    IN_REVIEW: ['CHANGES_REQUESTED', 'COMPLETED', 'IN_PROGRESS'],
    CHANGES_REQUESTED: ['IN_PROGRESS'],
    BLOCKED: ['TODO', 'IN_PROGRESS'],
    COMPLETED: [],
    CANCELLED: [],
  };

  async createTask(
    teamId: string,
    projectId: string,
    dto: CreateTaskDto,
    userId: string,
  ) {
    // Verify project exists and belongs to team
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, teamId },
      include: { team: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify milestone (if provided) belongs to this project
    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findUnique({
        where: { id: dto.milestoneId, projectId },
      });

      if (!milestone) {
        throw new BadRequestException('Milestone not found or does not belong to this project');
      }
    }

    // Validate dates
    if (dto.startDate && dto.dueDate) {
      const start = new Date(dto.startDate);
      const due = new Date(dto.dueDate);
      if (start >= due) {
        throw new BadRequestException('Start date must be before due date');
      }
    }

    // Create task
    const task = await this.prisma.task.create({
      data: {
        teamId,
        projectId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        weight: dto.weight || 1,
        milestoneId: dto.milestoneId,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdBy: userId,
        status: 'TODO',
      },
      include: {
        project: true,
        milestone: true,
        assignees: {
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: userId,
      action: 'CREATE_TASK',
      entityType: 'Task',
      entityId: task.id,
      teamId,
      metadata: {
        taskTitle: task.title,
        projectId,
        priority: task.priority,
      },
    });

    return task;
  }

  async listProjectTasks(
    teamId: string,
    projectId: string,
    filters: TaskFilterDto,
  ) {
    // Build where clause
    const where: Prisma.TaskWhereInput = {
      teamId,
      projectId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.milestoneId) {
      where.milestoneId = filters.milestoneId;
    }

    if (filters.assigneeId) {
      where.assignees = {
        some: {
          teamMemberId: filters.assigneeId,
          status: 'ACTIVE',
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        project: true,
        milestone: true,
        assignees: {
          where: { status: 'ACTIVE' },
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return tasks;
  }

  async getTaskById(teamId: string, projectId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
        teamId,
        projectId,
      },
      include: {
        project: true,
        milestone: true,
        assignees: {
          where: { status: 'ACTIVE' },
          include: {
            teamMember: {
              include: { user: true },
            },
            contributionLogs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        reviews: {
          include: {
            taskAssignee: {
              include: {
                teamMember: {
                  include: { user: true },
                },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateTask(
    teamId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
  ) {
    // Verify task exists
    const existingTask = await this.prisma.task.findUnique({
      where: { id: taskId, teamId, projectId },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    // Verify milestone (if changing)
    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findUnique({
        where: { id: dto.milestoneId, projectId },
      });

      if (!milestone) {
        throw new BadRequestException('Milestone not found or does not belong to this project');
      }
    }

    // Validate dates if both are provided
    if (dto.startDate && dto.dueDate) {
      const start = new Date(dto.startDate);
      const due = new Date(dto.dueDate);
      if (start >= due) {
        throw new BadRequestException('Start date must be before due date');
      }
    }

    // Update task
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        weight: dto.weight,
        milestoneId: dto.milestoneId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        project: true,
        milestone: true,
        assignees: {
          where: { status: 'ACTIVE' },
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: userId,
      action: 'UPDATE_TASK',
      entityType: 'Task',
      entityId: taskId,
      teamId,
      metadata: {
        updates: dto,
      },
    });

    return task;
  }

  async updateTaskStatus(
    teamId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskStatusDto,
    userId: string,
  ) {
    // Get task with current status
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, teamId, projectId },
      include: {
        assignees: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Validate status transition
    const validTransitions = this.VALID_TRANSITIONS[task.status];
    if (!validTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${task.status} to ${dto.status}. Valid transitions: ${validTransitions.join(', ')}`,
      );
    }

    // Additional validation for IN_REVIEW status
    if (dto.status === 'IN_REVIEW') {
      // Check that all assignees have submitted progress
      if (task.assignees.length === 0) {
        throw new BadRequestException('Cannot move to IN_REVIEW: no assignees found');
      }

      const allSubmitted = task.assignees.every(
        (assignee) => assignee.reportedProgress > 0,
      );

      if (!allSubmitted) {
        throw new BadRequestException(
          'Cannot move to IN_REVIEW: all assignees must submit progress first',
        );
      }
    }

    // Update status
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: dto.status },
      include: {
        project: true,
        milestone: true,
        assignees: {
          where: { status: 'ACTIVE' },
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: userId,
      action: 'UPDATE_TASK',
      entityType: 'Task',
      entityId: taskId,
      teamId,
      metadata: {
        statusChange: {
          from: task.status,
          to: dto.status,
        },
      },
    });

    return updatedTask;
  }

  async deleteTask(
    teamId: string,
    projectId: string,
    taskId: string,
    userId: string,
  ) {
    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, teamId, projectId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if task has assignees or contributions
    const hasWork = await this.prisma.taskAssignee.count({
      where: { taskId },
    });

    if (hasWork > 0) {
      throw new BadRequestException(
        'Cannot delete task with assignees. Consider setting status to CANCELLED instead.',
      );
    }

    // Delete task
    await this.prisma.task.delete({
      where: { id: taskId },
    });

    // Log audit event
    await this.auditService.log({
      actorId: userId,
      action: 'UPDATE_TASK',
      entityType: 'Task',
      entityId: taskId,
      teamId,
      metadata: {
        action: 'deleted',
        taskTitle: task.title,
      },
    });

    return { success: true, message: 'Task deleted successfully' };
  }
}

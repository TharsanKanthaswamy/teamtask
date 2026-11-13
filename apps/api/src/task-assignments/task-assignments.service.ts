import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateAssignmentWeightDto } from './dto/update-assignment-weight.dto';

@Injectable()
export class TaskAssignmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Validate that total allocated weight doesn't exceed 100%
   */
  private async validateWeights(
    taskId: string,
    newWeight: number,
    excludeAssigneeId?: string,
  ): Promise<void> {
    const assignees = await this.prisma.taskAssignee.findMany({
      where: {
        taskId,
        status: 'ACTIVE',
        id: excludeAssigneeId ? { not: excludeAssigneeId } : undefined,
      },
    });

    const currentTotal = assignees.reduce((sum, a) => sum + a.allocatedWeight, 0);
    const newTotal = currentTotal + newWeight;

    if (newTotal > 100) {
      throw new BadRequestException(
        `Total allocation would be ${newTotal}%. Maximum is 100%. Current allocation: ${currentTotal}%`,
      );
    }
  }

  async assignTask(
    teamId: string,
    taskId: string,
    dto: AssignTaskDto,
    actorId: string,
  ) {
    // Verify task exists and belongs to team
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, teamId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify team member exists and is active
    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        id: dto.teamMemberId,
        teamId,
        status: 'ACTIVE',
      },
      include: {
        user: true,
      },
    });

    if (!teamMember) {
      throw new BadRequestException('Team member not found or not active');
    }

    // Check if already assigned
    const existingAssignment = await this.prisma.taskAssignee.findUnique({
      where: {
        taskId_teamMemberId: {
          taskId,
          teamMemberId: dto.teamMemberId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException('This member is already assigned to this task');
    }

    // Validate total weight won't exceed 100%
    await this.validateWeights(taskId, dto.allocatedWeight);

    // Create assignment
    const assignment = await this.prisma.taskAssignee.create({
      data: {
        teamId,
        taskId,
        teamMemberId: dto.teamMemberId,
        allocatedWeight: dto.allocatedWeight,
        responsibility: dto.responsibility,
      },
      include: {
        teamMember: {
          include: {
            user: true,
          },
        },
        task: true,
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId,
      action: 'ASSIGN_TASK',
      entityType: 'TaskAssignee',
      entityId: assignment.id,
      teamId,
      metadata: {
        taskId,
        taskTitle: task.title,
        assignedTo: teamMember.user.name,
        allocatedWeight: dto.allocatedWeight,
      },
    });

    // Send notification to assigned member
    await this.notificationsService.notifyTaskAssigned(
      teamMember.userId,
      task.title,
      taskId,
    );

    return assignment;
  }

  async listTaskAssignees(teamId: string, taskId: string) {
    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, teamId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const assignees = await this.prisma.taskAssignee.findMany({
      where: {
        taskId,
        status: 'ACTIVE',
      },
      include: {
        teamMember: {
          include: {
            user: true,
          },
        },
        contributionLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });

    // Calculate total allocated weight
    const totalWeight = assignees.reduce((sum, a) => sum + a.allocatedWeight, 0);

    return {
      assignees,
      totalAllocatedWeight: totalWeight,
      remainingWeight: 100 - totalWeight,
    };
  }

  async updateAssignmentWeight(
    teamId: string,
    taskId: string,
    assigneeId: string,
    dto: UpdateAssignmentWeightDto,
    actorId: string,
  ) {
    // Verify assignment exists
    const assignment = await this.prisma.taskAssignee.findFirst({
      where: {
        id: assigneeId,
        taskId,
        teamId,
        status: 'ACTIVE',
      },
      include: {
        task: true,
        teamMember: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if weight is actually changing
    if (assignment.allocatedWeight === dto.allocatedWeight) {
      return assignment;
    }

    // Validate new total weight (excluding current assignment)
    await this.validateWeights(taskId, dto.allocatedWeight, assigneeId);

    // Update weight
    const updatedAssignment = await this.prisma.taskAssignee.update({
      where: { id: assigneeId },
      data: {
        allocatedWeight: dto.allocatedWeight,
      },
      include: {
        teamMember: {
          include: {
            user: true,
          },
        },
        task: true,
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId,
      action: 'ASSIGN_TASK',
      entityType: 'TaskAssignee',
      entityId: assigneeId,
      teamId,
      metadata: {
        taskId,
        taskTitle: assignment.task.title,
        assignee: assignment.teamMember.user.name,
        weightChange: {
          from: assignment.allocatedWeight,
          to: dto.allocatedWeight,
        },
      },
    });

    return updatedAssignment;
  }

  async unassignTask(
    teamId: string,
    taskId: string,
    assigneeId: string,
    actorId: string,
  ) {
    // Verify assignment exists
    const assignment = await this.prisma.taskAssignee.findFirst({
      where: {
        id: assigneeId,
        taskId,
        teamId,
        status: 'ACTIVE',
      },
      include: {
        task: true,
        teamMember: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if there are any contribution logs
    const hasContributions = await this.prisma.contributionLog.count({
      where: { taskAssigneeId: assigneeId },
    });

    if (hasContributions > 0) {
      // Soft delete - set status to INACTIVE
      await this.prisma.taskAssignee.update({
        where: { id: assigneeId },
        data: { status: 'INACTIVE' },
      });
    } else {
      // Hard delete if no contributions
      await this.prisma.taskAssignee.delete({
        where: { id: assigneeId },
      });
    }

    // Log audit event
    await this.auditService.log({
      actorId,
      action: 'UNASSIGN_TASK',
      entityType: 'TaskAssignee',
      entityId: assigneeId,
      teamId,
      metadata: {
        taskId,
        taskTitle: assignment.task.title,
        unassignedFrom: assignment.teamMember.user.name,
        allocatedWeight: assignment.allocatedWeight,
      },
    });

    return { success: true, message: 'Assignment removed successfully' };
  }

  async getAssigneeDetails(teamId: string, assigneeId: string) {
    const assignee = await this.prisma.taskAssignee.findFirst({
      where: {
        id: assigneeId,
        teamId,
      },
      include: {
        task: {
          include: {
            project: true,
            milestone: true,
          },
        },
        teamMember: {
          include: {
            user: true,
          },
        },
        contributionLogs: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!assignee) {
      throw new NotFoundException('Assignment not found');
    }

    return assignee;
  }
}

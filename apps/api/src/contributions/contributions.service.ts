import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubmitContributionDto } from './dto/submit-contribution.dto';

@Injectable()
export class ContributionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async submitContribution(
    assigneeId: string,
    dto: SubmitContributionDto,
    userId: string,
  ) {
    // Get assignment details
    const assignee = await this.prisma.taskAssignee.findUnique({
      where: { id: assigneeId },
      include: {
        teamMember: {
          include: { user: true },
        },
        task: {
          include: {
            project: {
              include: {
                projectLead: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    if (!assignee) {
      throw new NotFoundException('Assignment not found');
    }

    // Verify this is the assigned member
    if (assignee.teamMember.userId !== userId) {
      throw new ForbiddenException('You can only submit contributions for tasks assigned to you');
    }

    // Verify assignment is still active
    if (assignee.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot submit contribution for inactive assignment');
    }

    // Validate progress doesn't decrease
    if (dto.progressPercent < assignee.reportedProgress) {
      throw new BadRequestException(
        `Progress cannot decrease from ${assignee.reportedProgress}% to ${dto.progressPercent}%`,
      );
    }

    // Create immutable contribution log
    const contribution = await this.prisma.contributionLog.create({
      data: {
        teamId: assignee.teamId,
        taskAssigneeId: assigneeId,
        submittedBy: userId,
        progressPercent: dto.progressPercent,
        hoursSpent: dto.hoursSpent,
        description: dto.description,
        evidenceUrl: dto.evidenceUrl,
      },
    });

    // Update reported progress on assignment
    await this.prisma.taskAssignee.update({
      where: { id: assigneeId },
      data: {
        reportedProgress: dto.progressPercent,
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: userId,
      action: 'SUBMIT_CONTRIBUTION',
      entityType: 'ContributionLog',
      entityId: contribution.id,
      teamId: assignee.teamId,
      metadata: {
        taskId: assignee.taskId,
        taskTitle: assignee.task.title,
        progressPercent: dto.progressPercent,
        hoursSpent: dto.hoursSpent,
      },
    });

    // Send notification to Project Lead
    await this.notificationsService.notifyContributionSubmitted(
      assignee.task.project.projectLead.userId,
      assignee.teamMember.user.name,
      assignee.task.title,
      assignee.taskId,
    );

    return contribution;
  }

  async listAssigneeContributions(teamId: string, assigneeId: string) {
    // Verify assignment exists
    const assignee = await this.prisma.taskAssignee.findFirst({
      where: { id: assigneeId, teamId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignment not found');
    }

    const contributions = await this.prisma.contributionLog.findMany({
      where: {
        taskAssigneeId: assigneeId,
        teamId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return contributions;
  }

  async getMemberContributions(
    teamId: string,
    userId: string,
    projectId?: string,
  ) {
    // Get team member ID
    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        teamId,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Build where clause
    const where: any = {
      teamId,
      taskAssignee: {
        teamMemberId: teamMember.id,
      },
    };

    if (projectId) {
      where.taskAssignee = {
        ...where.taskAssignee,
        task: {
          projectId,
        },
      };
    }

    const contributions = await this.prisma.contributionLog.findMany({
      where,
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
    });

    // Calculate statistics
    const totalHours = contributions.reduce(
      (sum, c) => sum + (c.hoursSpent || 0),
      0,
    );

    const tasksWithContributions = new Set(
      contributions.map((c) => c.taskAssignee.taskId),
    ).size;

    return {
      contributions,
      statistics: {
        totalContributions: contributions.length,
        totalHours,
        tasksContributedTo: tasksWithContributions,
      },
    };
  }

  async getContributionById(teamId: string, contributionId: string) {
    const contribution = await this.prisma.contributionLog.findFirst({
      where: {
        id: contributionId,
        teamId,
      },
      include: {
        taskAssignee: {
          include: {
            task: {
              include: {
                project: true,
              },
            },
            teamMember: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!contribution) {
      throw new NotFoundException('Contribution not found');
    }

    return contribution;
  }
}

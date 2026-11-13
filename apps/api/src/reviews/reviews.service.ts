import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ProgressCalculationService } from '../progress/progress-calculation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ApproveReviewDto } from './dto/approve-review.dto';
import { RejectReviewDto } from './dto/reject-review.dto';
import { RequestChangesDto } from './dto/request-changes.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private progressService: ProgressCalculationService,
    private notificationsService: NotificationsService,
  ) {}

  async submitForReview(
    teamId: string,
    taskId: string,
    dto: SubmitReviewDto,
    userId: string,
  ) {
    // Get assignment
    const assignee = await this.prisma.taskAssignee.findFirst({
      where: {
        id: dto.taskAssigneeId,
        taskId,
        teamId,
        status: 'ACTIVE',
      },
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

    // Verify submitter is the assigned member
    if (assignee.teamMember.userId !== userId) {
      throw new ForbiddenException('You can only submit your own work for review');
    }

    // Check if progress has been reported
    if (assignee.reportedProgress === 0) {
      throw new BadRequestException('You must submit progress before requesting review');
    }

    // Check for existing pending review
    const existingReview = await this.prisma.taskReview.findFirst({
      where: {
        taskId,
        taskAssigneeId: dto.taskAssigneeId,
        status: 'PENDING',
      },
    });

    if (existingReview) {
      throw new BadRequestException('A pending review already exists for this assignment');
    }

    // Create review
    const review = await this.prisma.taskReview.create({
      data: {
        teamId,
        taskId,
        taskAssigneeId: dto.taskAssigneeId,
        submittedBy: userId,
        status: 'PENDING',
      },
      include: {
        taskAssignee: {
          include: {
            teamMember: {
              include: { user: true },
            },
          },
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

    // Log audit event
    await this.auditService.log({
      actorId: userId,
      action: 'SUBMIT_CONTRIBUTION',
      entityType: 'TaskReview',
      entityId: review.id,
      teamId,
      metadata: {
        taskId,
        taskTitle: review.task.title,
        reportedProgress: assignee.reportedProgress,
      },
    });

    // TODO: Send notification to Project Lead

    return review;
  }

  async approveReview(
    teamId: string,
    reviewId: string,
    dto: ApproveReviewDto,
    reviewerId: string,
  ) {
    // Get review
    const review = await this.prisma.taskReview.findFirst({
      where: {
        id: reviewId,
        teamId,
      },
      include: {
        taskAssignee: {
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
        task: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if already processed
    if (review.status !== 'PENDING') {
      throw new BadRequestException('Review has already been processed');
    }

    // Prevent self-approval
    if (review.submittedBy === reviewerId) {
      throw new ForbiddenException('You cannot approve your own work');
    }

    // Update review status
    await this.prisma.taskReview.update({
      where: { id: reviewId },
      data: {
        status: 'APPROVED',
        reviewerId,
        feedback: dto.feedback,
        reviewedAt: new Date(),
      },
    });

    // Update approved progress to match reported progress
    await this.prisma.taskAssignee.update({
      where: { id: review.taskAssigneeId },
      data: {
        approvedProgress: review.taskAssignee.reportedProgress,
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: reviewerId,
      action: 'APPROVE_CONTRIBUTION',
      entityType: 'TaskReview',
      entityId: reviewId,
      teamId,
      metadata: {
        taskId: review.taskId,
        taskTitle: review.task.title,
        approvedProgress: review.taskAssignee.reportedProgress,
      },
    });

    // Recalculate task progress (may auto-complete task if all assignees at 100%)
    await this.progressService.recalculateTaskProgress(review.taskId);

    // Send notification to contributor
    await this.notificationsService.notifyWorkApproved(
      review.taskAssignee.teamMember.userId,
      review.task.title,
      review.taskId,
    );

    return review;
  }

  async rejectReview(
    teamId: string,
    reviewId: string,
    dto: RejectReviewDto,
    reviewerId: string,
  ) {
    // Get review
    const review = await this.prisma.taskReview.findFirst({
      where: {
        id: reviewId,
        teamId,
      },
      include: {
        taskAssignee: {
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
        task: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if already processed
    if (review.status !== 'PENDING') {
      throw new BadRequestException('Review has already been processed');
    }

    // Prevent self-rejection
    if (review.submittedBy === reviewerId) {
      throw new ForbiddenException('You cannot reject your own work');
    }

    // Update review status
    await this.prisma.taskReview.update({
      where: { id: reviewId },
      data: {
        status: 'REJECTED',
        reviewerId,
        feedback: dto.feedback,
        reviewedAt: new Date(),
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: reviewerId,
      action: 'REJECT_CONTRIBUTION',
      entityType: 'TaskReview',
      entityId: reviewId,
      teamId,
      metadata: {
        taskId: review.taskId,
        taskTitle: review.task.title,
      },
    });

    // TODO: Send notification to contributor

    return review;
  }

  async requestChanges(
    teamId: string,
    reviewId: string,
    dto: RequestChangesDto,
    reviewerId: string,
  ) {
    // Get review
    const review = await this.prisma.taskReview.findFirst({
      where: {
        id: reviewId,
        teamId,
      },
      include: {
        taskAssignee: {
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
        task: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if already processed
    if (review.status !== 'PENDING') {
      throw new BadRequestException('Review has already been processed');
    }

    // Prevent self-review
    if (review.submittedBy === reviewerId) {
      throw new ForbiddenException('You cannot request changes on your own work');
    }

    // Update review status
    await this.prisma.taskReview.update({
      where: { id: reviewId },
      data: {
        status: 'CHANGES_REQUESTED',
        reviewerId,
        feedback: dto.feedback,
        reviewedAt: new Date(),
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: reviewerId,
      action: 'REQUEST_CHANGES',
      entityType: 'TaskReview',
      entityId: reviewId,
      teamId,
      metadata: {
        taskId: review.taskId,
        taskTitle: review.task.title,
      },
    });

    // Send notification to contributor
    await this.notificationsService.notifyChangesRequested(
      review.taskAssignee.teamMember.userId,
      review.task.title,
      review.taskId,
      dto.feedback,
    );

    return review;
  }

  async listTaskReviews(teamId: string, taskId: string) {
    const reviews = await this.prisma.taskReview.findMany({
      where: {
        teamId,
        taskId,
      },
      include: {
        taskAssignee: {
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return reviews;
  }

  async getPendingReviews(teamId: string, projectId?: string) {
    const where: any = {
      teamId,
      status: 'PENDING',
    };

    if (projectId) {
      where.task = {
        projectId,
      };
    }

    const reviews = await this.prisma.taskReview.findMany({
      where,
      include: {
        task: {
          include: {
            project: true,
          },
        },
        taskAssignee: {
          include: {
            teamMember: {
              include: { user: true },
            },
            contributionLogs: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    return reviews;
  }

  async getReviewById(teamId: string, reviewId: string) {
    const review = await this.prisma.taskReview.findFirst({
      where: {
        id: reviewId,
        teamId,
      },
      include: {
        task: {
          include: {
            project: true,
          },
        },
        taskAssignee: {
          include: {
            teamMember: {
              include: { user: true },
            },
            contributionLogs: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }
}

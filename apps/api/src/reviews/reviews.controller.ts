import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ApproveReviewDto } from './dto/approve-review.dto';
import { RejectReviewDto } from './dto/reject-review.dto';
import { RequestChangesDto } from './dto/request-changes.dto';

@Controller()
@UseGuards(AuthGuard)
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('teams/:teamId/tasks/:taskId/reviews/submit')
  async submitForReview(
    @Param('teamId') teamId: string,
    @Param('taskId') taskId: string,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const review = await this.reviewsService.submitForReview(
      teamId,
      taskId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: review,
    };
  }

  @Get('teams/:teamId/tasks/:taskId/reviews')
  async listTaskReviews(
    @Param('teamId') teamId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const reviews = await this.reviewsService.listTaskReviews(teamId, taskId);

    return {
      success: true,
      data: reviews,
    };
  }

  @Get('teams/:teamId/reviews/pending')
  async getPendingReviews(
    @Param('teamId') teamId: string,
    @Query('projectId') projectId: string | undefined,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // If filtering by project, verify user has access
    if (projectId && !user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('You can only view reviews for projects you lead');
      }
    }

    const reviews = await this.reviewsService.getPendingReviews(teamId, projectId);

    return {
      success: true,
      data: reviews,
    };
  }

  @Patch('teams/:teamId/reviews/:reviewId/approve')
  async approveReview(
    @Param('teamId') teamId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: ApproveReviewDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Get review to check project
    const review = await this.reviewsService['prisma'].taskReview.findFirst({
      where: { id: reviewId, teamId },
      include: { task: true },
    });

    if (!review) {
      throw new ForbiddenException('Review not found');
    }

    // Only Team Leads, Project Leads, and Super Admins can approve
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        review.task.projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can approve reviews');
      }
    }

    const result = await this.reviewsService.approveReview(
      teamId,
      reviewId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Patch('teams/:teamId/reviews/:reviewId/reject')
  async rejectReview(
    @Param('teamId') teamId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: RejectReviewDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Get review to check project
    const review = await this.reviewsService['prisma'].taskReview.findFirst({
      where: { id: reviewId, teamId },
      include: { task: true },
    });

    if (!review) {
      throw new ForbiddenException('Review not found');
    }

    // Only Team Leads, Project Leads, and Super Admins can reject
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        review.task.projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can reject reviews');
      }
    }

    const result = await this.reviewsService.rejectReview(
      teamId,
      reviewId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Patch('teams/:teamId/reviews/:reviewId/request-changes')
  async requestChanges(
    @Param('teamId') teamId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: RequestChangesDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Get review to check project
    const review = await this.reviewsService['prisma'].taskReview.findFirst({
      where: { id: reviewId, teamId },
      include: { task: true },
    });

    if (!review) {
      throw new ForbiddenException('Review not found');
    }

    // Only Team Leads, Project Leads, and Super Admins can request changes
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        review.task.projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can request changes');
      }
    }

    const result = await this.reviewsService.requestChanges(
      teamId,
      reviewId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('teams/:teamId/reviews/:reviewId')
  async getReview(
    @Param('teamId') teamId: string,
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const review = await this.reviewsService.getReviewById(teamId, reviewId);

    return {
      success: true,
      data: review,
    };
  }
}

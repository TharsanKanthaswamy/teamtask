import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContributionsService } from './contributions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { SubmitContributionDto } from './dto/submit-contribution.dto';

@Controller()
@UseGuards(AuthGuard)
export class ContributionsController {
  constructor(
    private readonly contributionsService: ContributionsService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('task-assignees/:assigneeId/contributions')
  async submitContribution(
    @Param('assigneeId') assigneeId: string,
    @Body() dto: SubmitContributionDto,
    @CurrentUser() user: any,
  ) {
    // Get assignee to determine team
    const assignee = await this.contributionsService['prisma'].taskAssignee.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new Error('Assignment not found');
    }

    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      assignee.teamId,
      user.isAdmin,
    );

    const contribution = await this.contributionsService.submitContribution(
      assigneeId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: contribution,
    };
  }

  @Get('task-assignees/:assigneeId/contributions')
  async listAssigneeContributions(
    @Param('assigneeId') assigneeId: string,
    @CurrentUser() user: any,
  ) {
    // Get assignee to determine team
    const assignee = await this.contributionsService['prisma'].taskAssignee.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new Error('Assignment not found');
    }

    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      assignee.teamId,
      user.isAdmin,
    );

    const contributions = await this.contributionsService.listAssigneeContributions(
      assignee.teamId,
      assigneeId,
    );

    return {
      success: true,
      data: contributions,
    };
  }

  @Get('teams/:teamId/members/:memberId/contributions')
  async getMemberContributions(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Query('projectId') projectId: string | undefined,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Get user ID from member ID
    const teamMember = await this.contributionsService['prisma'].teamMember.findUnique({
      where: { id: memberId },
    });

    if (!teamMember) {
      throw new Error('Team member not found');
    }

    const result = await this.contributionsService.getMemberContributions(
      teamId,
      teamMember.userId,
      projectId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('teams/:teamId/contributions/:contributionId')
  async getContribution(
    @Param('teamId') teamId: string,
    @Param('contributionId') contributionId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const contribution = await this.contributionsService.getContributionById(
      teamId,
      contributionId,
    );

    return {
      success: true,
      data: contribution,
    };
  }
}

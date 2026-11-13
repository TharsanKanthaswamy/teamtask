import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Controller('teams/:teamId/projects/:projectId/milestones')
@UseGuards(AuthGuard)
export class MilestonesController {
  constructor(
    private readonly milestonesService: MilestonesService,
    private readonly tenantService: TenantService,
  ) {}

  @Post()
  async createMilestone(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can create milestones
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can create milestones');
    }

    const milestone = await this.milestonesService.createMilestone(
      projectId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: milestone,
    };
  }

  @Get()
  async listMilestones(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const milestones = await this.milestonesService.listProjectMilestones(projectId);

    return {
      success: true,
      data: milestones,
    };
  }

  @Get(':milestoneId')
  async getMilestone(
    @Param('teamId') teamId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const milestone = await this.milestonesService.getMilestoneById(milestoneId);

    return {
      success: true,
      data: milestone,
    };
  }

  @Patch(':milestoneId')
  async updateMilestone(
    @Param('teamId') teamId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can update milestones
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can update milestones');
    }

    const milestone = await this.milestonesService.updateMilestone(
      milestoneId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: milestone,
    };
  }

  @Delete(':milestoneId')
  async deleteMilestone(
    @Param('teamId') teamId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can delete milestones
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can delete milestones');
    }

    await this.milestonesService.deleteMilestone(milestoneId, user.userId);

    return {
      success: true,
      message: 'Milestone deleted successfully',
    };
  }
}

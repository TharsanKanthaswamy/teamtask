import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { AssignProjectLeadDto } from './dto/assign-project-lead.dto';
import { ProjectStatus } from '@prisma/client';

@Controller('teams/:teamId/projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tenantService: TenantService,
  ) {}

  @Post()
  async createProject(
    @Param('teamId') teamId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context (ensures user has access to this team)
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can create projects
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can create projects');
    }

    const project = await this.projectsService.createProject(teamId, dto, user.userId);

    return {
      success: true,
      data: project,
    };
  }

  @Get()
  async listProjects(
    @Param('teamId') teamId: string,
    @Query('status') status: ProjectStatus | undefined,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const projects = await this.projectsService.listTeamProjects(teamId, status);

    return {
      success: true,
      data: projects,
    };
  }

  @Get('stats')
  async getProjectStats(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const stats = await this.projectsService.getProjectStats(teamId);

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':projectId')
  async getProject(
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

    const project = await this.projectsService.getProjectById(projectId);

    // Verify project belongs to the requested team
    if (project.teamId !== teamId) {
      throw new BadRequestException('Project does not belong to this team');
    }

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':projectId')
  async updateProject(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can update projects
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can update projects');
    }

    const project = await this.projectsService.updateProject(
      projectId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':projectId/status')
  async updateProjectStatus(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectStatusDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can change project status
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can change project status');
    }

    const project = await this.projectsService.updateProjectStatus(
      projectId,
      dto.status,
      user.userId,
    );

    return {
      success: true,
      data: project,
    };
  }

  @Patch(':projectId/lead')
  async assignProjectLead(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Body() dto: AssignProjectLeadDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can assign project leads
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can assign project leads');
    }

    const project = await this.projectsService.assignProjectLead(
      projectId,
      dto.teamMemberId,
      user.userId,
    );

    return {
      success: true,
      data: project,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';

@Controller('teams/:teamId/projects/:projectId/members')
@UseGuards(AuthGuard)
export class ProjectMembersController {
  constructor(
    private readonly projectMembersService: ProjectMembersService,
    private readonly tenantService: TenantService,
  ) {}

  @Post()
  async addMember(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can add members
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can add project members');
    }

    const member = await this.projectMembersService.addMember(
      projectId,
      dto.teamMemberId,
      dto.responsibility,
      user.userId,
    );

    return {
      success: true,
      data: member,
    };
  }

  @Get()
  async getMembers(
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

    const members = await this.projectMembersService.getProjectMembers(projectId);

    return {
      success: true,
      data: members,
    };
  }

  @Delete(':memberId')
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can remove members
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new BadRequestException('Only Team Leads can remove project members');
    }

    await this.projectMembersService.removeMember(projectId, memberId, user.userId);

    return {
      success: true,
      message: 'Member removed successfully',
    };
  }
}

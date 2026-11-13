import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { TenantService } from '../tenant/tenant.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('teams')
@Controller('teams')
@UseGuards(AuthGuard)
export class TeamsController {
  constructor(
    private teamsService: TeamsService,
    private tenantService: TenantService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all teams (Super Admin sees all, members see assigned)' })
  @ApiResponse({ status: 200, description: 'Teams retrieved successfully' })
  async listTeams(@CurrentUser() user: CurrentUserData) {
    if (user.isAdmin) {
      const teams = await this.teamsService.listTeams();
      return { success: true, data: teams };
    }
    const userTeams = await this.tenantService.getUserTeams(user.userId);
    return {
      success: true,
      data: userTeams.map((t) => ({
        id: t.teamId,
        name: t.teamName,
        slug: t.teamSlug,
        role: t.role,
        status: 'ACTIVE',
      })),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiResponse({ status: 200, description: 'Team retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async getTeam(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    if (!user.isAdmin) {
      const userTeams = await this.tenantService.getUserTeams(user.userId);
      const hasAccess = userTeams.some((t) => t.teamId === id);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this team');
      }
    }
    const team = await this.teamsService.getTeamById(id);
    return { success: true, data: team };
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new team (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  @ApiResponse({ status: 409, description: 'Team slug already exists' })
  async createTeam(
    @Body() body: { name: string; slug: string; description?: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    const team = await this.teamsService.createTeam(
      body.name,
      body.slug,
      body.description || null,
      user.userId,
    );
    return { success: true, data: team };
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update team (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  async updateTeam(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    const team = await this.teamsService.updateTeam(id, body, user.userId);
    return { success: true, data: team };
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update team status (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Team status updated successfully' })
  async updateTeamStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' },
    @CurrentUser() user: CurrentUserData,
  ) {
    const team = await this.teamsService.updateTeamStatus(id, body.status, user.userId);
    return { success: true, data: team };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get team members' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  async getTeamMembers(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    if (!user.isAdmin) {
      const userTeams = await this.tenantService.getUserTeams(user.userId);
      const hasAccess = userTeams.some((t) => t.teamId === id);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this team');
      }
    }
    const members = await this.teamsService.getTeamMembers(id);
    return { success: true, data: members };
  }

  @Get(':id/members/:memberId/profile')
  @ApiOperation({ summary: 'Get team member detailed profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getMemberProfile(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.isAdmin) {
      const userTeams = await this.tenantService.getUserTeams(user.userId);
      const hasAccess = userTeams.some((t) => t.teamId === id);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this team');
      }
    }
    const profile = await this.teamsService.getMemberProfile(id, memberId);
    return { success: true, data: profile };
  }

  @Post(':id/members')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Add member to team (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 409, description: 'User already in team' })
  async addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role: 'TEAM_LEAD' | 'TEAM_MEMBER' },
    @CurrentUser() user: CurrentUserData,
  ) {
    const member = await this.teamsService.addMember(id, body.userId, body.role, user.userId);
    return { success: true, data: member };
  }

  @Delete(':id/members/:memberId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Remove member from team (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.teamsService.removeMember(id, memberId, user.userId);
    return { success: true };
  }

  @Patch(':id/lead')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Assign team lead (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Team lead assigned successfully' })
  async assignTeamLead(
    @Param('id') id: string,
    @Body() body: { userId: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.teamsService.assignTeamLead(id, body.userId, user.userId);
    return { success: true };
  }
}

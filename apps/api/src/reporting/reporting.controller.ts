import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  Header,
} from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { GenerateReportDto, ReportFormat } from './dto/generate-report.dto';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly tenantService: TenantService,
  ) {}

  @Get('teams/:teamId/performance')
  @Header('Content-Type', 'text/csv')
  async generateTeamReport(
    @Param('teamId') teamId: string,
    @Query() dto: GenerateReportDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can generate team reports
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new ForbiddenException('Only Team Leads and Super Admins can generate team reports');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const report = await this.reportingService.generateTeamReport(
      teamId,
      startDate,
      endDate,
    );

    const format = dto.format || ReportFormat.CSV;

    if (format === ReportFormat.JSON) {
      return {
        success: true,
        data: report.json,
      };
    }

    return report.csv;
  }

  @Get('projects/:projectId/completion')
  @Header('Content-Type', 'text/csv')
  async generateProjectReport(
    @Param('projectId') projectId: string,
    @Query() dto: GenerateReportDto,
    @CurrentUser() user: any,
  ) {
    // Get project to determine team
    const project = await this.reportingService['prisma'].project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      project.teamId,
      user.isAdmin,
    );

    // Team Leads, Project Leads, and Super Admins can generate project reports
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException(
          'Only Team Leads, Project Leads, and Super Admins can generate project reports',
        );
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const report = await this.reportingService.generateProjectReport(
      projectId,
      startDate,
      endDate,
    );

    const format = dto.format || ReportFormat.CSV;

    if (format === ReportFormat.JSON) {
      return {
        success: true,
        data: report.json,
      };
    }

    return report.csv;
  }

  @Get('members/:userId/contributions')
  @Header('Content-Type', 'text/csv')
  async generateMemberReport(
    @Param('userId') targetUserId: string,
    @Query('teamId') teamId: string | undefined,
    @Query() dto: GenerateReportDto,
    @CurrentUser() user: any,
  ) {
    // Users can generate their own reports
    // Team Leads and Super Admins can generate reports for team members
    if (user.userId !== targetUserId && !user.isAdmin) {
      if (teamId) {
        const context = await this.tenantService.resolveTenantContext(
          user.userId,
          teamId,
          user.isAdmin,
        );

        if (context.role !== 'TEAM_LEAD') {
          throw new ForbiddenException('Only Team Leads can generate reports for other members');
        }
      } else {
        throw new ForbiddenException('You can only generate your own reports');
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const report = await this.reportingService.generateMemberReport(
      targetUserId,
      teamId,
      startDate,
      endDate,
    );

    const format = dto.format || ReportFormat.CSV;

    if (format === ReportFormat.JSON) {
      return {
        success: true,
        data: report.json,
      };
    }

    return report.csv;
  }

  @Get('projects/:projectId/tasks')
  @Header('Content-Type', 'text/csv')
  async generateTasksReport(
    @Param('projectId') projectId: string,
    @Query() dto: GenerateReportDto,
    @CurrentUser() user: any,
  ) {
    // Get project to determine team
    const project = await this.reportingService['prisma'].project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new ForbiddenException('Project not found');
    }

    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      project.teamId,
      user.isAdmin,
    );

    // Team Leads, Project Leads, and Super Admins can generate task reports
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException(
          'Only Team Leads, Project Leads, and Super Admins can generate task reports',
        );
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const report = await this.reportingService.generateTasksReport(
      projectId,
      startDate,
      endDate,
    );

    const format = dto.format || ReportFormat.CSV;

    if (format === ReportFormat.JSON) {
      return {
        success: true,
        data: report.json,
      };
    }

    return report.csv;
  }

  @Get('teams/:teamId/deadlines')
  @Header('Content-Type', 'text/csv')
  async generateDeadlineReport(
    @Param('teamId') teamId: string,
    @Query() dto: GenerateReportDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads and Super Admins can generate deadline reports
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      throw new ForbiddenException('Only Team Leads and Super Admins can generate deadline reports');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const report = await this.reportingService.generateDeadlineReport(
      teamId,
      startDate,
      endDate,
    );

    const format = dto.format || ReportFormat.CSV;

    if (format === ReportFormat.JSON) {
      return {
        success: true,
        data: report.json,
      };
    }

    return report.csv;
  }
}

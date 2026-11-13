import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TaskAssignmentsService } from './task-assignments.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateAssignmentWeightDto } from './dto/update-assignment-weight.dto';

@Controller('tasks/:taskId/assignees')
@UseGuards(AuthGuard)
export class TaskAssignmentsController {
  constructor(
    private readonly taskAssignmentsService: TaskAssignmentsService,
    private readonly tenantService: TenantService,
  ) {}

  @Post()
  async assignTask(
    @Param('taskId') taskId: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: any,
  ) {
    // Get task to determine team and project
    const task = await this.taskAssignmentsService['prisma'].task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      task.teamId,
      user.isAdmin,
    );

    // Only Team Leads, Project Leads, and Super Admins can assign tasks
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        task.projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can assign tasks');
      }
    }

    const assignment = await this.taskAssignmentsService.assignTask(
      task.teamId,
      taskId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: assignment,
    };
  }

  @Get()
  async listAssignees(
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    // Get task to determine team
    const task = await this.taskAssignmentsService['prisma'].task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      task.teamId,
      user.isAdmin,
    );

    const result = await this.taskAssignmentsService.listTaskAssignees(
      task.teamId,
      taskId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Patch(':assigneeId/weight')
  async updateWeight(
    @Param('taskId') taskId: string,
    @Param('assigneeId') assigneeId: string,
    @Body() dto: UpdateAssignmentWeightDto,
    @CurrentUser() user: any,
  ) {
    // Get task to determine team and project
    const task = await this.taskAssignmentsService['prisma'].task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      task.teamId,
      user.isAdmin,
    );

    // Only Team Leads, Project Leads, and Super Admins can update weights
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        task.projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can update assignments');
      }
    }

    const assignment = await this.taskAssignmentsService.updateAssignmentWeight(
      task.teamId,
      taskId,
      assigneeId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: assignment,
    };
  }

  @Delete(':assigneeId')
  async unassignTask(
    @Param('taskId') taskId: string,
    @Param('assigneeId') assigneeId: string,
    @CurrentUser() user: any,
  ) {
    // Get task to determine team and project
    const task = await this.taskAssignmentsService['prisma'].task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      task.teamId,
      user.isAdmin,
    );

    // Only Team Leads, Project Leads, and Super Admins can unassign
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        task.projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can unassign tasks');
      }
    }

    const result = await this.taskAssignmentsService.unassignTask(
      task.teamId,
      taskId,
      assigneeId,
      user.userId,
    );

    return result;
  }

  @Get(':assigneeId')
  async getAssigneeDetails(
    @Param('taskId') taskId: string,
    @Param('assigneeId') assigneeId: string,
    @CurrentUser() user: any,
  ) {
    // Get task to determine team
    const task = await this.taskAssignmentsService['prisma'].task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      task.teamId,
      user.isAdmin,
    );

    const assignee = await this.taskAssignmentsService.getAssigneeDetails(
      task.teamId,
      assigneeId,
    );

    return {
      success: true,
      data: assignee,
    };
  }
}

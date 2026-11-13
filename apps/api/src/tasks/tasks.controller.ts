import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantService } from '../tenant/tenant.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskFilterDto } from './dto/task-filter.dto';

@Controller('teams/:teamId/projects/:projectId/tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly tenantService: TenantService,
  ) {}

  @Post()
  async createTask(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context (ensures user has access to this team)
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads, Project Leads, and Super Admins can create tasks
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      // Check if user is project lead for this specific project
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can create tasks');
      }
    }

    const task = await this.tasksService.createTask(
      teamId,
      projectId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: task,
    };
  }

  @Get()
  async listTasks(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Query() filters: TaskFilterDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const tasks = await this.tasksService.listProjectTasks(
      teamId,
      projectId,
      filters,
    );

    return {
      success: true,
      data: tasks,
    };
  }

  @Get(':taskId')
  async getTask(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    const task = await this.tasksService.getTaskById(
      teamId,
      projectId,
      taskId,
    );

    return {
      success: true,
      data: task,
    };
  }

  @Patch(':taskId')
  async updateTask(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads, Project Leads, and Super Admins can update tasks
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can update tasks');
      }
    }

    const task = await this.tasksService.updateTask(
      teamId,
      projectId,
      taskId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: task,
    };
  }

  @Patch(':taskId/status')
  async updateTaskStatus(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Team members can update status if they're assigned to the task
    // Team Leads, Project Leads, and Admins can always update
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        projectId,
      );

      if (!isProjectLead) {
        // Check if user is assigned to this task
        const isAssigned = await this.tenantService.isTaskAssignee(
          user.userId,
          taskId,
        );

        if (!isAssigned) {
          throw new ForbiddenException('You can only update status for tasks assigned to you');
        }
      }
    }

    const task = await this.tasksService.updateTaskStatus(
      teamId,
      projectId,
      taskId,
      dto,
      user.userId,
    );

    return {
      success: true,
      data: task,
    };
  }

  @Delete(':taskId')
  async deleteTask(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    // Resolve tenant context
    const context = await this.tenantService.resolveTenantContext(
      user.userId,
      teamId,
      user.isAdmin,
    );

    // Only Team Leads, Project Leads, and Super Admins can delete tasks
    if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
      const isProjectLead = await this.tenantService.isProjectLead(
        user.userId,
        projectId,
      );

      if (!isProjectLead) {
        throw new ForbiddenException('Only Team Leads and Project Leads can delete tasks');
      }
    }

    const result = await this.tasksService.deleteTask(
      teamId,
      projectId,
      taskId,
      user.userId,
    );

    return result;
  }
}

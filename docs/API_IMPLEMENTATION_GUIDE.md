# API Implementation Guide

This guide provides detailed specifications for implementing the remaining backend API modules for TeamTrack's final milestone.

## Table of Contents

1. [Tasks Module](#tasks-module)
2. [Task Assignments Module](#task-assignments-module)
3. [Contribution Tracking Module](#contribution-tracking-module)
4. [Task Review Module](#task-review-module)
5. [Progress Calculation Service](#progress-calculation-service)
6. [Notifications Module](#notifications-module)
7. [Analytics Module](#analytics-module)
8. [Reporting Module](#reporting-module)

---

## Tasks Module

### Module Structure
```
apps/api/src/tasks/
├── tasks.module.ts
├── tasks.controller.ts
├── tasks.service.ts
└── dto/
    ├── create-task.dto.ts
    ├── update-task.dto.ts
    ├── update-task-status.dto.ts
    └── task-filter.dto.ts
```

### DTOs

**create-task.dto.ts:**
```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsInt, Min, IsISO8601 } from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsInt()
  @Min(1)
  @IsOptional()
  weight?: number;

  @IsUUID()
  @IsOptional()
  milestoneId?: string;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;
}
```

### Endpoints

#### POST /api/v1/teams/:teamId/projects/:projectId/tasks
**Authorization:** Team Lead, Project Lead, Super Admin  
**Request Body:** CreateTaskDto  
**Response:** Created task with relations

**Business Logic:**
1. Validate user has access to team
2. Validate project exists and belongs to team
3. Validate milestone (if provided) belongs to project
4. Create task with default status TODO
5. Log audit event (CREATE_TASK)
6. Return task with project and milestone relations

**Example:**
```typescript
async createTask(teamId: string, projectId: string, dto: CreateTaskDto, userId: string) {
  // Resolve tenant context
  await this.tenantService.resolveTenantContext(userId, teamId, isAdmin);
  
  // Verify project exists
  const project = await this.prisma.project.findUnique({
    where: { id: projectId, teamId },
  });
  
  if (!project) {
    throw new NotFoundException('Project not found');
  }
  
  // Create task in transaction
  const task = await this.prisma.task.create({
    data: {
      teamId,
      projectId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority || 'MEDIUM',
      weight: dto.weight || 1,
      milestoneId: dto.milestoneId,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      createdBy: userId,
      status: 'TODO',
    },
    include: {
      project: true,
      milestone: true,
      assignees: {
        include: {
          teamMember: {
            include: { user: true },
          },
        },
      },
    },
  });
  
  await this.auditService.log({
    actorId: userId,
    action: 'CREATE_TASK',
    entityType: 'Task',
    entityId: task.id,
    teamId,
    metadata: { taskTitle: task.title, projectId },
  });
  
  return task;
}
```

#### GET /api/v1/teams/:teamId/projects/:projectId/tasks
**Authorization:** All team members  
**Query Parameters:**
- `status`: TaskStatus (optional)
- `priority`: TaskPriority (optional)
- `milestoneId`: UUID (optional)
- `assigneeId`: UUID (optional)
- `search`: string (optional)

**Returns:** Array of tasks with assignees

#### PATCH /api/v1/teams/:teamId/projects/:projectId/tasks/:taskId/status
**Authorization:** Team Lead, Project Lead, Assignee  
**Request Body:** `{ status: TaskStatus }`

**Business Logic:**
1. Validate status transition is valid
2. Update task status
3. If moving to IN_REVIEW, check all assignees have submitted progress
4. If moving to COMPLETED, verify approved progress
5. Send notifications to assignees
6. Log audit event

**Valid Status Transitions:**
```
BACKLOG → TODO
TODO → IN_PROGRESS | BACKLOG
IN_PROGRESS → IN_REVIEW | TODO | BLOCKED
IN_REVIEW → CHANGES_REQUESTED | COMPLETED | IN_PROGRESS
CHANGES_REQUESTED → IN_PROGRESS
BLOCKED → TODO | IN_PROGRESS
COMPLETED → (final state)
CANCELLED → (final state)
```

---

## Task Assignments Module

### Endpoints

#### POST /api/v1/tasks/:taskId/assignees
**Authorization:** Team Lead, Project Lead  
**Request Body:**
```typescript
{
  teamMemberId: string;
  responsibility?: string;
  allocatedWeight: number; // 1-100
}
```

**Business Logic:**
1. Validate team member belongs to task's team
2. Check if already assigned
3. Validate total weights won't exceed 100%
4. Create assignment
5. Send TASK_ASSIGNED notification
6. Log audit event

**Weight Validation:**
```typescript
async validateWeights(taskId: string, newWeight: number, excludeAssigneeId?: string) {
  const assignees = await this.prisma.taskAssignee.findMany({
    where: {
      taskId,
      status: 'ACTIVE',
      id: excludeAssigneeId ? { not: excludeAssigneeId } : undefined,
    },
  });
  
  const currentTotal = assignees.reduce((sum, a) => sum + a.allocatedWeight, 0);
  const newTotal = currentTotal + newWeight;
  
  if (newTotal > 100) {
    throw new BadRequestException(
      `Total allocation would be ${newTotal}%. Maximum is 100%.`
    );
  }
  
  if (newTotal < 100 && someConditionRequires100) {
    throw new BadRequestException(
      `Total allocation is ${newTotal}%. Must equal 100%.`
    );
  }
}
```

---

## Contribution Tracking Module

### Endpoints

#### POST /api/v1/task-assignees/:assigneeId/contributions
**Authorization:** Assigned member only (can't submit for others)  
**Request Body:**
```typescript
{
  progressPercent: number; // 0-100
  hoursSpent?: number;
  description: string;
  evidenceUrl?: string;
}
```

**Business Logic:**
1. Verify caller is the assigned member
2. Validate progress is 0-100
3. Check progress doesn't decrease from last submission
4. Create immutable contribution log
5. Update taskAssignee.reportedProgress
6. Send CONTRIBUTION_SUBMITTED notification to Project Lead
7. Log audit event

**Progress Validation:**
```typescript
async submitContribution(assigneeId: string, dto: SubmitContributionDto, userId: string) {
  const assignee = await this.prisma.taskAssignee.findUnique({
    where: { id: assigneeId },
    include: {
      teamMember: true,
      task: {
        include: {
          project: {
            include: { projectLead: { include: { user: true } } },
          },
        },
      },
    },
  });
  
  // Verify this is the assigned member
  if (assignee.teamMember.userId !== userId) {
    throw new ForbiddenException('Can only submit your own contributions');
  }
  
  // Validate progress doesn't decrease
  if (dto.progressPercent < assignee.reportedProgress) {
    throw new BadRequestException(
      `Progress cannot decrease from ${assignee.reportedProgress}% to ${dto.progressPercent}%`
    );
  }
  
  // Create contribution log (immutable)
  const log = await this.prisma.contributionLog.create({
    data: {
      teamId: assignee.teamId,
      taskAssigneeId: assigneeId,
      submittedBy: userId,
      progressPercent: dto.progressPercent,
      hoursSpent: dto.hoursSpent,
      description: dto.description,
      evidenceUrl: dto.evidenceUrl,
    },
  });
  
  // Update reported progress
  await this.prisma.taskAssignee.update({
    where: { id: assigneeId },
    data: { reportedProgress: dto.progressPercent },
  });
  
  // Notify Project Lead
  await this.notificationService.create({
    userId: assignee.task.project.projectLead.userId,
    type: 'CONTRIBUTION_SUBMITTED',
    title: 'New Progress Update',
    message: `${assignee.teamMember.user.name} submitted progress on "${assignee.task.title}"`,
    entityType: 'Task',
    entityId: assignee.taskId,
  });
  
  return log;
}
```

---

## Task Review Module

### Endpoints

#### POST /api/v1/tasks/:taskId/reviews/submit
**Authorization:** Assigned member  
**Request Body:** `{ taskAssigneeId: string }`

**Creates review in PENDING status for Project Lead**

#### PATCH /api/v1/reviews/:reviewId/approve
**Authorization:** Project Lead, Team Lead, Super Admin  
**Request Body:** `{ feedback?: string }`

**Business Logic:**
1. Verify reviewer is authorized
2. Get latest contribution for this assignee
3. Update review status to APPROVED
4. Update taskAssignee.approvedProgress = reportedProgress
5. Recalculate task and project progress
6. Send WORK_APPROVED notification
7. Log audit event

```typescript
async approveReview(reviewId: string, feedback: string | undefined, reviewerId: string) {
  const review = await this.prisma.taskReview.findUnique({
    where: { id: reviewId },
    include: {
      taskAssignee: {
        include: {
          teamMember: { include: { user: true } },
        },
      },
      task: true,
    },
  });
  
  if (review.status !== 'PENDING') {
    throw new BadRequestException('Review has already been processed');
  }
  
  // Update review
  await this.prisma.taskReview.update({
    where: { id: reviewId },
    data: {
      status: 'APPROVED',
      reviewerId,
      feedback,
      reviewedAt: new Date(),
    },
  });
  
  // Update approved progress
  await this.prisma.taskAssignee.update({
    where: { id: review.taskAssigneeId },
    data: {
      approvedProgress: review.taskAssignee.reportedProgress,
    },
  });
  
  // Recalculate progress
  await this.progressService.recalculateTaskProgress(review.taskId);
  
  // Notify contributor
  await this.notificationService.create({
    userId: review.taskAssignee.teamMember.userId,
    type: 'WORK_APPROVED',
    title: 'Work Approved',
    message: `Your progress on "${review.task.title}" has been approved`,
    entityType: 'Task',
    entityId: review.taskId,
  });
  
  await this.auditService.log({
    actorId: reviewerId,
    action: 'APPROVE_CONTRIBUTION',
    entityType: 'TaskReview',
    entityId: reviewId,
    teamId: review.teamId,
  });
}
```

---

## Progress Calculation Service

### Core Functions

```typescript
@Injectable()
export class ProgressCalculationService {
  
  /**
   * Calculate individual contribution points for a task assignee
   * Formula: C_i = W_i × P_i / 100
   * @param allocatedWeight - Weight allocated to this assignee (W_i)
   * @param approvedProgress - Approved progress percentage (P_i)
   * @returns Contribution points
   */
  calculateIndividualContribution(
    allocatedWeight: number,
    approvedProgress: number
  ): number {
    return (allocatedWeight * approvedProgress) / 100;
  }
  
  /**
   * Calculate verified task progress
   * Formula: SUM(W_i × P_i / 100) for all assignees
   * @param taskId - Task ID
   * @returns Verified progress percentage (0-100)
   */
  async calculateTaskProgress(taskId: string): Promise<{
    reportedProgress: number;
    approvedProgress: number;
  }> {
    const assignees = await this.prisma.taskAssignee.findMany({
      where: {
        taskId,
        status: 'ACTIVE',
      },
    });
    
    if (assignees.length === 0) {
      return { reportedProgress: 0, approvedProgress: 0 };
    }
    
    const reported = assignees.reduce((sum, assignee) => {
      return sum + this.calculateIndividualContribution(
        assignee.allocatedWeight,
        assignee.reportedProgress
      );
    }, 0);
    
    const approved = assignees.reduce((sum, assignee) => {
      return sum + this.calculateIndividualContribution(
        assignee.allocatedWeight,
        assignee.approvedProgress
      );
    }, 0);
    
    return {
      reportedProgress: Math.round(reported),
      approvedProgress: Math.round(approved),
    };
  }
  
  /**
   * Calculate project completion percentage
   * Formula: SUM(task_weight × verified_progress) / SUM(task_weight)
   * Excludes CANCELLED tasks
   */
  async calculateProjectProgress(projectId: string): Promise<{
    reportedProgress: number;
    approvedProgress: number;
    totalTasks: number;
    completedTasks: number;
  }> {
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        status: { not: 'CANCELLED' },
      },
      include: {
        assignees: {
          where: { status: 'ACTIVE' },
        },
      },
    });
    
    if (tasks.length === 0) {
      return {
        reportedProgress: 0,
        approvedProgress: 0,
        totalTasks: 0,
        completedTasks: 0,
      };
    }
    
    let totalWeight = 0;
    let weightedReported = 0;
    let weightedApproved = 0;
    let completedCount = 0;
    
    for (const task of tasks) {
      const progress = await this.calculateTaskProgress(task.id);
      
      totalWeight += task.weight;
      weightedReported += task.weight * progress.reportedProgress / 100;
      weightedApproved += task.weight * progress.approvedProgress / 100;
      
      if (task.status === 'COMPLETED') {
        completedCount++;
      }
    }
    
    return {
      reportedProgress: Math.round((weightedReported / totalWeight) * 100),
      approvedProgress: Math.round((weightedApproved / totalWeight) * 100),
      totalTasks: tasks.length,
      completedTasks: completedCount,
    };
  }
  
  /**
   * Calculate individual member's contribution across project
   */
  async calculateMemberProjectContribution(
    projectId: string,
    teamMemberId: string
  ): Promise<{
    totalAllocatedWeight: number;
    reportedCompletion: number;
    approvedCompletion: number;
    tasksCount: number;
  }> {
    const assignees = await this.prisma.taskAssignee.findMany({
      where: {
        teamMemberId,
        task: {
          projectId,
          status: { not: 'CANCELLED' },
        },
        status: 'ACTIVE',
      },
      include: {
        task: true,
      },
    });
    
    if (assignees.length === 0) {
      return {
        totalAllocatedWeight: 0,
        reportedCompletion: 0,
        approvedCompletion: 0,
        tasksCount: 0,
      };
    }
    
    // Calculate weighted completion
    let totalWeight = 0;
    let reportedSum = 0;
    let approvedSum = 0;
    
    for (const assignee of assignees) {
      const weight = assignee.task.weight * (assignee.allocatedWeight / 100);
      totalWeight += weight;
      reportedSum += weight * (assignee.reportedProgress / 100);
      approvedSum += weight * (assignee.approvedProgress / 100);
    }
    
    return {
      totalAllocatedWeight: assignees.reduce((sum, a) => sum + a.allocatedWeight, 0),
      reportedCompletion: totalWeight > 0 ? Math.round((reportedSum / totalWeight) * 100) : 0,
      approvedCompletion: totalWeight > 0 ? Math.round((approvedSum / totalWeight) * 100) : 0,
      tasksCount: assignees.length,
    };
  }
}
```

### Unit Tests

**progress-calculation.service.spec.ts** (Required tests):
```typescript
describe('ProgressCalculationService', () => {
  describe('calculateIndividualContribution', () => {
    it('should calculate correct contribution for full weight and progress', () => {
      expect(service.calculateIndividualContribution(100, 50)).toBe(50);
    });
    
    it('should calculate correct contribution for partial weight', () => {
      expect(service.calculateIndividualContribution(40, 75)).toBe(30);
    });
    
    it('should handle zero progress', () => {
      expect(service.calculateIndividualContribution(100, 0)).toBe(0);
    });
    
    it('should handle zero weight', () => {
      expect(service.calculateIndividualContribution(0, 100)).toBe(0);
    });
  });
  
  describe('calculateTaskProgress', () => {
    it('should sum contributions from multiple assignees', async () => {
      // Assignee 1: 40% weight, 75% progress = 30 points
      // Assignee 2: 60% weight, 50% progress = 30 points
      // Total: 60% progress
    });
    
    it('should handle single assignee with 100% weight', async () => {
      // Single assignee: 100% weight, 50% progress = 50% task progress
    });
    
    it('should return zero for task with no assignees', async () => {});
    
    it('should exclude inactive assignees', async () => {});
    
    it('should differentiate reported vs approved progress', async () => {});
  });
  
  describe('calculateProjectProgress', () => {
    it('should weight tasks by their weight values', async () => {
      // Task 1: weight 3, 100% done = 3 * 100 = 300
      // Task 2: weight 1, 0% done = 1 * 0 = 0
      // Total: 300 / 4 = 75%
    });
    
    it('should exclude cancelled tasks', async () => {});
    
    it('should handle project with no tasks', async () => {});
    
    it('should handle tasks with no assignees', async () => {});
  });
});
```

---

## Notifications Module

### Endpoints

#### GET /api/v1/notifications
**Query:** `?unreadOnly=true&limit=50&offset=0`

#### PATCH /api/v1/notifications/:id/read

#### PATCH /api/v1/notifications/read-all

#### GET /api/v1/notifications/unread-count

### Notification Creation

```typescript
async createNotification(dto: CreateNotificationDto) {
  return this.prisma.notification.create({
    data: {
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      entityType: dto.entityType,
      entityId: dto.entityId,
      isRead: false,
    },
  });
}
```

### Event Triggers

Integrate notification creation into:
- Task assignment
- Task status changes
- Contribution submissions
- Review decisions
- Approaching deadlines (cron job)
- Overdue tasks (cron job)
- Project Lead changes
- Project membership changes

---

## Analytics Module

### Endpoints

#### GET /api/v1/analytics/global (Super Admin only)
Returns:
```typescript
{
  totalTeams: number;
  totalUsers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingReviews: number;
  averageProjectCompletion: number;
  topPerformingTeams: Array<{ teamId, teamName, completionRate }>;
  bottomPerformingTeams: Array<{ teamId, teamName, completionRate }>;
}
```

#### GET /api/v1/analytics/teams/:teamId
Returns team-level analytics

#### GET /api/v1/analytics/projects/:projectId
Returns project-level analytics with member breakdowns

#### GET /api/v1/analytics/members/:memberId
Returns individual performance metrics

---

## Reporting Module

### Endpoints

#### GET /api/v1/reports/teams/:teamId/performance?format=csv
Generates team performance report

#### GET /api/v1/reports/projects/:projectId/completion?format=pdf
Generates project completion report

**CSV Generation Example:**
```typescript
import { stringify } from 'csv-stringify/sync';

async generateTeamReport(teamId: string) {
  const data = await this.analyticsService.getTeamAnalytics(teamId);
  
  const records = data.members.map(m => ({
    'Member Name': m.name,
    'Tasks Assigned': m.tasksCount,
    'Tasks Completed': m.completedCount,
    'Completion Rate': `${m.completionRate}%`,
    'Approved Progress': `${m.approvedProgress}%`,
    'On-Time Rate': `${m.onTimeRate}%`,
  }));
  
  return stringify(records, { header: true });
}
```

---

## Authorization Pattern

All endpoints must follow this pattern:

```typescript
@UseGuards(AuthGuard)
async method(@Param('teamId') teamId: string, @CurrentUser() user: any) {
  // 1. Resolve tenant context (ensures team access)
  const context = await this.tenantService.resolveTenantContext(
    user.userId,
    teamId,
    user.isAdmin,
  );
  
  // 2. Check specific role requirements
  if (!user.isAdmin && context.role !== 'TEAM_LEAD') {
    throw new ForbiddenException('Requires Team Lead or Admin');
  }
  
  // 3. Perform operation (RLS enforces tenant isolation at DB level)
  // ...
}
```

---

## Testing Requirements

Each module must include:

1. **Unit tests** for service methods
2. **Integration tests** for complete workflows
3. **Security tests** for cross-tenant access prevention
4. **Edge case tests** for boundary conditions

Target: **>80% code coverage** on all business logic.

---

## Next Steps

1. Implement Tasks module following this guide
2. Implement Progress Calculation service with comprehensive tests
3. Implement Contributions module
4. Implement Review module
5. Test end-to-end workflow
6. Add remaining analytics and reporting

Refer to existing modules (Projects, Milestones) for architectural patterns and best practices.

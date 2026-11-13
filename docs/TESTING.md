# TeamTrack Testing Guide

## Testing Philosophy

TeamTrack follows a **security-first, behavior-driven** testing approach:

1. **Security tests first** — Multi-tenancy isolation is non-negotiable
2. **Business logic coverage** — Core calculations and workflows must be verified
3. **Integration over unit** — Test actual database interactions, not mocked data
4. **E2E for critical paths** — Complete user workflows from login to analytics

**Target Coverage:** >80% on all business logic, 100% on security-critical paths.

---

## Test Structure

```
apps/api/
├── test/
│   ├── unit/              # Isolated service logic tests
│   ├── integration/        # API endpoint + database tests
│   ├── security/           # Cross-tenant isolation tests
│   └── e2e/                # Full workflow tests
└── src/
    └── **/*.spec.ts        # Co-located unit tests

apps/web/
├── __tests__/
│   ├── components/         # Component unit tests
│   ├── integration/        # Page/flow tests
│   └── e2e/                # Playwright E2E tests
└── src/
    └── **/*.test.tsx       # Co-located component tests
```

---

## Backend Testing

### Setup Test Database

**test-setup.ts:**
```typescript
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Reset test database
  execSync('pnpm --filter @teamtrack/database prisma migrate reset --force', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
  
  // Initialize RLS context
  await prisma.$executeRaw`SELECT set_tenant_context(NULL, false)`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

**.env.test:**
```bash
DATABASE_URL="postgresql://teamtrack:password@localhost:5432/teamtrack_test"
SESSION_SECRET="test-secret-do-not-use-in-production"
```

### Unit Tests — Progress Calculation Service

**progress-calculation.service.spec.ts:**
```typescript
import { ProgressCalculationService } from './progress-calculation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProgressCalculationService', () => {
  let service: ProgressCalculationService;
  let prisma: PrismaService;
  
  beforeEach(() => {
    prisma = new PrismaService();
    service = new ProgressCalculationService(prisma);
  });
  
  describe('calculateIndividualContribution', () => {
    it('should calculate correct contribution for full weight and progress', () => {
      const result = service.calculateIndividualContribution(100, 50);
      expect(result).toBe(50);
    });
    
    it('should calculate correct contribution for partial weight', () => {
      const result = service.calculateIndividualContribution(40, 75);
      expect(result).toBe(30);
    });
    
    it('should handle zero progress', () => {
      const result = service.calculateIndividualContribution(100, 0);
      expect(result).toBe(0);
    });
    
    it('should handle zero weight', () => {
      const result = service.calculateIndividualContribution(0, 100);
      expect(result).toBe(0);
    });
  });
  
  describe('calculateTaskProgress', () => {
    let taskId: string;
    
    beforeEach(async () => {
      // Create test task with assignees
      const team = await prisma.team.create({
        data: { name: 'Test Team' },
      });
      
      const project = await prisma.project.create({
        data: {
          teamId: team.id,
          name: 'Test Project',
          status: 'ACTIVE',
        },
      });
      
      const task = await prisma.task.create({
        data: {
          teamId: team.id,
          projectId: project.id,
          title: 'Test Task',
          weight: 1,
          createdBy: '00000000-0000-0000-0000-000000000000',
        },
      });
      
      taskId = task.id;
    });
    
    it('should sum contributions from multiple assignees correctly', async () => {
      // Assignee 1: 40% weight, 75% progress = 30 points
      // Assignee 2: 60% weight, 50% progress = 30 points
      // Total: 60% progress
      
      const member1 = await prisma.teamMember.create({
        data: {
          teamId: task.teamId,
          userId: '00000000-0000-0000-0000-000000000001',
          role: 'MEMBER',
        },
      });
      
      const member2 = await prisma.teamMember.create({
        data: {
          teamId: task.teamId,
          userId: '00000000-0000-0000-0000-000000000002',
          role: 'MEMBER',
        },
      });
      
      await prisma.taskAssignee.createMany({
        data: [
          {
            teamId: task.teamId,
            taskId,
            teamMemberId: member1.id,
            allocatedWeight: 40,
            approvedProgress: 75,
          },
          {
            teamId: task.teamId,
            taskId,
            teamMemberId: member2.id,
            allocatedWeight: 60,
            approvedProgress: 50,
          },
        ],
      });
      
      const result = await service.calculateTaskProgress(taskId);
      
      expect(result.approvedProgress).toBe(60);
    });
    
    it('should return zero for task with no assignees', async () => {
      const result = await service.calculateTaskProgress(taskId);
      
      expect(result.reportedProgress).toBe(0);
      expect(result.approvedProgress).toBe(0);
    });
    
    it('should exclude inactive assignees from calculation', async () => {
      const member = await prisma.teamMember.create({
        data: {
          teamId: task.teamId,
          userId: '00000000-0000-0000-0000-000000000001',
          role: 'MEMBER',
        },
      });
      
      await prisma.taskAssignee.create({
        data: {
          teamId: task.teamId,
          taskId,
          teamMemberId: member.id,
          allocatedWeight: 100,
          approvedProgress: 100,
          status: 'INACTIVE',
        },
      });
      
      const result = await service.calculateTaskProgress(taskId);
      
      expect(result.approvedProgress).toBe(0);
    });
    
    it('should differentiate reported vs approved progress', async () => {
      const member = await prisma.teamMember.create({
        data: {
          teamId: task.teamId,
          userId: '00000000-0000-0000-0000-000000000001',
          role: 'MEMBER',
        },
      });
      
      await prisma.taskAssignee.create({
        data: {
          teamId: task.teamId,
          taskId,
          teamMemberId: member.id,
          allocatedWeight: 100,
          reportedProgress: 80,
          approvedProgress: 50,
        },
      });
      
      const result = await service.calculateTaskProgress(taskId);
      
      expect(result.reportedProgress).toBe(80);
      expect(result.approvedProgress).toBe(50);
    });
  });
  
  describe('calculateProjectProgress', () => {
    it('should weight tasks by their weight values', async () => {
      // Task 1: weight 3, 100% done = 3 * 100 = 300
      // Task 2: weight 1, 0% done = 1 * 0 = 0
      // Total: 300 / 4 = 75%
      
      const team = await prisma.team.create({
        data: { name: 'Test Team' },
      });
      
      const project = await prisma.project.create({
        data: {
          teamId: team.id,
          name: 'Test Project',
          status: 'ACTIVE',
        },
      });
      
      const task1 = await prisma.task.create({
        data: {
          teamId: team.id,
          projectId: project.id,
          title: 'Heavy Task',
          weight: 3,
          createdBy: '00000000-0000-0000-0000-000000000000',
        },
      });
      
      const task2 = await prisma.task.create({
        data: {
          teamId: team.id,
          projectId: project.id,
          title: 'Light Task',
          weight: 1,
          createdBy: '00000000-0000-0000-0000-000000000000',
        },
      });
      
      // Setup assignees with 100% progress on task1, 0% on task2
      // ... (create members and assignees)
      
      const result = await service.calculateProjectProgress(project.id);
      
      expect(result.approvedProgress).toBe(75);
    });
    
    it('should exclude cancelled tasks', async () => {
      // Create cancelled task, ensure it doesn't affect calculation
    });
    
    it('should handle project with no tasks', async () => {
      const team = await prisma.team.create({
        data: { name: 'Test Team' },
      });
      
      const project = await prisma.project.create({
        data: {
          teamId: team.id,
          name: 'Empty Project',
          status: 'ACTIVE',
        },
      });
      
      const result = await service.calculateProjectProgress(project.id);
      
      expect(result.approvedProgress).toBe(0);
      expect(result.totalTasks).toBe(0);
    });
  });
});
```

### Integration Tests — Task Assignment Workflow

**task-assignment.integration.spec.ts:**
```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Task Assignment Workflow (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let teamLeadToken: string;
  let teamId: string;
  let projectId: string;
  let taskId: string;
  let member1Id: string;
  let member2Id: string;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleRef.createNestApplication();
    await app.init();
    
    prisma = app.get(PrismaService);
    
    // Setup: create team, project, task, members
    const team = await prisma.team.create({
      data: { name: 'Assignment Test Team' },
    });
    teamId = team.id;
    
    const teamLead = await prisma.user.create({
      data: {
        email: 'lead@test.com',
        name: 'Team Lead',
        passwordHash: 'hashed',
        isAdmin: false,
      },
    });
    
    await prisma.teamMember.create({
      data: {
        teamId,
        userId: teamLead.id,
        role: 'TEAM_LEAD',
      },
    });
    
    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'lead@test.com', password: 'password' });
    
    teamLeadToken = loginRes.body.token;
    
    // Create project and task
    const project = await prisma.project.create({
      data: {
        teamId,
        name: 'Test Project',
        status: 'ACTIVE',
      },
    });
    projectId = project.id;
    
    const task = await prisma.task.create({
      data: {
        teamId,
        projectId,
        title: 'Shared Task',
        weight: 1,
        createdBy: teamLead.id,
      },
    });
    taskId = task.id;
    
    // Create two members
    const user1 = await prisma.user.create({
      data: {
        email: 'member1@test.com',
        name: 'Member 1',
        passwordHash: 'hashed',
      },
    });
    
    const user2 = await prisma.user.create({
      data: {
        email: 'member2@test.com',
        name: 'Member 2',
        passwordHash: 'hashed',
      },
    });
    
    const tm1 = await prisma.teamMember.create({
      data: { teamId, userId: user1.id, role: 'MEMBER' },
    });
    
    const tm2 = await prisma.teamMember.create({
      data: { teamId, userId: user2.id, role: 'MEMBER' },
    });
    
    member1Id = tm1.id;
    member2Id = tm2.id;
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
  
  it('should assign multiple contributors with weight validation', async () => {
    // Assign first contributor with 40% weight
    const res1 = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/assignees`)
      .set('Authorization', `Bearer ${teamLeadToken}`)
      .send({
        teamMemberId: member1Id,
        allocatedWeight: 40,
        responsibility: 'Backend implementation',
      })
      .expect(201);
    
    expect(res1.body.allocatedWeight).toBe(40);
    
    // Assign second contributor with 60% weight (total = 100%)
    const res2 = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/assignees`)
      .set('Authorization', `Bearer ${teamLeadToken}`)
      .send({
        teamMemberId: member2Id,
        allocatedWeight: 60,
        responsibility: 'Frontend implementation',
      })
      .expect(201);
    
    expect(res2.body.allocatedWeight).toBe(60);
  });
  
  it('should reject assignment that exceeds 100% total weight', async () => {
    // Try to assign third contributor with 10% weight (would total 110%)
    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/assignees`)
      .set('Authorization', `Bearer ${teamLeadToken}`)
      .send({
        teamMemberId: 'another-member-id',
        allocatedWeight: 10,
      })
      .expect(400);
  });
  
  it('should prevent duplicate assignment', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/assignees`)
      .set('Authorization', `Bearer ${teamLeadToken}`)
      .send({
        teamMemberId: member1Id,
        allocatedWeight: 20,
      })
      .expect(400);
  });
});
```

### Security Tests — Cross-Tenant Isolation

**tenant-isolation.security.spec.ts:**
```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Security: Tenant Isolation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let teamAlphaId: string;
  let teamBetaId: string;
  let alphaProjectId: string;
  let betaProjectId: string;
  let alphaTaskId: string;
  let betaTaskId: string;
  let alphaLeadToken: string;
  let betaMemberToken: string;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleRef.createNestApplication();
    await app.init();
    
    prisma = app.get(PrismaService);
    
    // Create Team Alpha
    const teamAlpha = await prisma.team.create({
      data: { name: 'Team Alpha' },
    });
    teamAlphaId = teamAlpha.id;
    
    // Create Team Beta
    const teamBeta = await prisma.team.create({
      data: { name: 'Team Beta' },
    });
    teamBetaId = teamBeta.id;
    
    // Create projects and tasks for both teams
    const alphaProject = await prisma.project.create({
      data: {
        teamId: teamAlphaId,
        name: 'Alpha Project',
        status: 'ACTIVE',
      },
    });
    alphaProjectId = alphaProject.id;
    
    const betaProject = await prisma.project.create({
      data: {
        teamId: teamBetaId,
        name: 'Beta Project',
        status: 'ACTIVE',
      },
    });
    betaProjectId = betaProject.id;
    
    const alphaTask = await prisma.task.create({
      data: {
        teamId: teamAlphaId,
        projectId: alphaProjectId,
        title: 'Alpha Task',
        weight: 1,
        createdBy: '00000000-0000-0000-0000-000000000000',
      },
    });
    alphaTaskId = alphaTask.id;
    
    const betaTask = await prisma.task.create({
      data: {
        teamId: teamBetaId,
        projectId: betaProjectId,
        title: 'Beta Task',
        weight: 1,
        createdBy: '00000000-0000-0000-0000-000000000000',
      },
    });
    betaTaskId = betaTask.id;
    
    // Create users and get tokens
    // ... (setup users and login)
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
  
  describe('Cross-team task access prevention', () => {
    it('should prevent Team Alpha lead from accessing Team Beta tasks', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/teams/${teamBetaId}/projects/${betaProjectId}/tasks/${betaTaskId}`)
        .set('Authorization', `Bearer ${alphaLeadToken}`)
        .expect(403);
    });
    
    it('should prevent Team Beta member from listing Team Alpha tasks', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/teams/${teamAlphaId}/projects/${alphaProjectId}/tasks`)
        .set('Authorization', `Bearer ${betaMemberToken}`)
        .expect(403);
    });
    
    it('should prevent cross-team task updates', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/teams/${teamBetaId}/projects/${betaProjectId}/tasks/${betaTaskId}`)
        .set('Authorization', `Bearer ${alphaLeadToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });
  
  describe('RLS enforcement at database level', () => {
    it('should enforce RLS even if application layer is bypassed', async () => {
      // Set tenant context to Team Alpha
      await prisma.$executeRaw`SELECT set_tenant_context(${teamAlphaId}::uuid, false)`;
      
      // Try to query Team Beta task (should return empty due to RLS)
      const tasks = await prisma.task.findMany({
        where: { id: betaTaskId },
      });
      
      expect(tasks).toHaveLength(0);
    });
    
    it('should allow Super Admin to access all teams', async () => {
      await prisma.$executeRaw`SELECT set_tenant_context(NULL, true)`;
      
      const allTasks = await prisma.task.findMany();
      
      expect(allTasks.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Contribution and review isolation', () => {
    it('should prevent viewing contributions from other teams', async () => {
      // Create contribution in Team Beta
      const betaMember = await prisma.teamMember.findFirst({
        where: { teamId: teamBetaId },
      });
      
      const betaAssignee = await prisma.taskAssignee.create({
        data: {
          teamId: teamBetaId,
          taskId: betaTaskId,
          teamMemberId: betaMember.id,
          allocatedWeight: 100,
        },
      });
      
      await prisma.contributionLog.create({
        data: {
          teamId: teamBetaId,
          taskAssigneeId: betaAssignee.id,
          submittedBy: betaMember.userId,
          progressPercent: 50,
          description: 'Sensitive Beta work',
        },
      });
      
      // Try to access from Team Alpha context
      await prisma.$executeRaw`SELECT set_tenant_context(${teamAlphaId}::uuid, false)`;
      
      const contributions = await prisma.contributionLog.findMany({
        where: { taskAssigneeId: betaAssignee.id },
      });
      
      expect(contributions).toHaveLength(0);
    });
  });
});
```

### E2E Test — Complete Task Workflow

**task-workflow.e2e.spec.ts:**
```typescript
describe('E2E: Complete Task Workflow', () => {
  let superAdmin: any;
  let teamLead: any;
  let projectLead: any;
  let member: any;
  
  beforeAll(async () => {
    // Setup users with different roles
  });
  
  it('should complete full task lifecycle', async () => {
    // 1. Super Admin creates team
    const team = await superAdmin.createTeam({ name: 'E2E Team' });
    
    // 2. Super Admin adds Team Lead
    await superAdmin.addTeamMember(team.id, {
      userId: teamLead.id,
      role: 'TEAM_LEAD',
    });
    
    // 3. Team Lead creates project and assigns Project Lead
    const project = await teamLead.createProject(team.id, {
      name: 'E2E Project',
      projectLeadId: projectLead.id,
    });
    
    // 4. Project Lead adds member to project
    await projectLead.addProjectMember(project.id, member.id);
    
    // 5. Project Lead creates task
    const task = await projectLead.createTask(project.id, {
      title: 'Implement feature X',
      priority: 'HIGH',
      weight: 1,
    });
    
    // 6. Project Lead assigns task to member (100% weight)
    await projectLead.assignTask(task.id, {
      teamMemberId: member.teamMemberId,
      allocatedWeight: 100,
    });
    
    // 7. Member submits progress
    await member.submitContribution(task.id, {
      progressPercent: 50,
      hoursSpent: 4,
      description: 'Completed backend API',
    });
    
    // 8. Member submits final progress
    await member.submitContribution(task.id, {
      progressPercent: 100,
      hoursSpent: 4,
      description: 'Completed tests and documentation',
    });
    
    // 9. Member submits task for review
    const review = await member.submitForReview(task.id);
    
    // 10. Project Lead approves review
    await projectLead.approveReview(review.id, {
      feedback: 'Great work!',
    });
    
    // 11. Verify task progress updated
    const updatedTask = await projectLead.getTask(task.id);
    expect(updatedTask.approvedProgress).toBe(100);
    
    // 12. Verify project progress updated
    const updatedProject = await projectLead.getProject(project.id);
    expect(updatedProject.approvedProgress).toBe(100);
    
    // 13. Verify analytics show correct data
    const analytics = await projectLead.getProjectAnalytics(project.id);
    expect(analytics.completedTasks).toBe(1);
    expect(analytics.totalTasks).toBe(1);
    
    // 14. Verify member sees contribution in history
    const contributions = await member.getMyContributions();
    expect(contributions).toHaveLength(2);
    expect(contributions[0].progressPercent).toBe(50);
    expect(contributions[1].progressPercent).toBe(100);
    
    // 15. Verify notifications were sent
    const notifications = await member.getNotifications();
    expect(notifications.some(n => n.type === 'WORK_APPROVED')).toBe(true);
  });
});
```

---

## Frontend Testing

### Component Unit Tests

**TaskCard.test.tsx:**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '123',
    title: 'Test Task',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignees: [
      { name: 'Alice', avatarUrl: '/alice.jpg' },
      { name: 'Bob', avatarUrl: '/bob.jpg' },
    ],
    dueDate: '2026-12-31',
  };
  
  it('should render task details', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
  
  it('should show correct priority badge color', () => {
    const { rerender } = render(<TaskCard task={mockTask} />);
    
    const highBadge = screen.getByText('HIGH');
    expect(highBadge).toHaveClass('badge-high-priority');
    
    rerender(<TaskCard task={{ ...mockTask, priority: 'LOW' }} />);
    
    const lowBadge = screen.getByText('LOW');
    expect(lowBadge).toHaveClass('badge-low-priority');
  });
  
  it('should call onClick when card is clicked', () => {
    const handleClick = jest.fn();
    render(<TaskCard task={mockTask} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Test Task'));
    
    expect(handleClick).toHaveBeenCalledWith(mockTask.id);
  });
  
  it('should show overdue indicator for past due tasks', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: '2020-01-01',
    };
    
    render(<TaskCard task={overdueTask} />);
    
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });
});
```

### Integration Tests — Form Submission

**ContributionForm.integration.test.tsx:**
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContributionForm } from './ContributionForm';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

describe('ContributionForm Integration', () => {
  const mockAssignee = {
    id: 'assignee-123',
    taskId: 'task-123',
    allocatedWeight: 100,
    reportedProgress: 50,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should submit contribution successfully', async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ success: true });
    (api.contributions.submit as jest.Mock).mockImplementation(mockSubmit);
    
    render(<ContributionForm assignee={mockAssignee} />);
    
    // Fill form
    const progressInput = screen.getByLabelText(/progress/i);
    const hoursInput = screen.getByLabelText(/hours/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await userEvent.clear(progressInput);
    await userEvent.type(progressInput, '75');
    await userEvent.type(hoursInput, '4');
    await userEvent.type(descriptionInput, 'Completed API endpoints');
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Verify API call
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(mockAssignee.id, {
        progressPercent: 75,
        hoursSpent: 4,
        description: 'Completed API endpoints',
      });
    });
  });
  
  it('should show error when progress decreases', async () => {
    render(<ContributionForm assignee={mockAssignee} />);
    
    const progressInput = screen.getByLabelText(/progress/i);
    
    // Try to set progress to 40 (less than current 50)
    await userEvent.clear(progressInput);
    await userEvent.type(progressInput, '40');
    
    expect(screen.getByText(/cannot decrease/i)).toBeInTheDocument();
  });
  
  it('should validate required fields', async () => {
    render(<ContributionForm assignee={mockAssignee} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
  });
});
```

### E2E Tests with Playwright

**task-management.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Project Lead
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'projectlead@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
  });
  
  test('should create task and assign member', async ({ page }) => {
    // Navigate to project
    await page.click('text=Test Project');
    
    // Click "Create Task" button
    await page.click('button:has-text("Create Task")');
    
    // Fill task form
    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'Task created by E2E test');
    await page.selectOption('select[name="priority"]', 'HIGH');
    
    await page.click('button:has-text("Create")');
    
    // Verify task appears in list
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
    
    // Open task detail
    await page.click('text=E2E Test Task');
    
    // Assign member
    await page.click('button:has-text("Assign")');
    await page.selectOption('select[name="teamMemberId"]', { label: 'Alice' });
    await page.fill('input[name="allocatedWeight"]', '100');
    await page.click('button:has-text("Confirm")');
    
    // Verify assignment
    await expect(page.locator('text=Alice')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();
  });
  
  test('should submit and approve contribution', async ({ page }) => {
    // Navigate to assigned task
    await page.click('text=My Tasks');
    await page.click('text=E2E Test Task');
    
    // Submit progress
    await page.click('button:has-text("Submit Progress")');
    await page.fill('input[name="progressPercent"]', '75');
    await page.fill('input[name="hoursSpent"]', '6');
    await page.fill('textarea[name="description"]', 'Completed implementation');
    await page.click('button:has-text("Submit")');
    
    // Verify success message
    await expect(page.locator('text=Progress submitted')).toBeVisible();
    
    // Switch to Project Lead view
    await page.goto('http://localhost:3000/reviews');
    
    // Find pending review
    await page.click('text=E2E Test Task');
    
    // Approve
    await page.click('button:has-text("Approve")');
    await page.fill('textarea[name="feedback"]', 'Great work!');
    await page.click('button:has-text("Confirm")');
    
    // Verify approval
    await expect(page.locator('text=Approved')).toBeVisible();
  });
});
```

---

## Running Tests

### Backend

```bash
# All tests
pnpm --filter @teamtrack/api test

# Unit tests only
pnpm --filter @teamtrack/api test:unit

# Integration tests
pnpm --filter @teamtrack/api test:integration

# Security tests
pnpm --filter @teamtrack/api test:security

# E2E tests
pnpm --filter @teamtrack/api test:e2e

# Coverage report
pnpm --filter @teamtrack/api test:cov
```

### Frontend

```bash
# All tests
pnpm --filter @teamtrack/web test

# Watch mode
pnpm --filter @teamtrack/web test:watch

# Coverage
pnpm --filter @teamtrack/web test:cov

# E2E with Playwright
pnpm --filter @teamtrack/web test:e2e

# E2E in UI mode (debug)
pnpm --filter @teamtrack/web test:e2e:ui
```

### CI Pipeline

**.github/workflows/test.yml:**
```yaml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: teamtrack
          POSTGRES_PASSWORD: password
          POSTGRES_DB: teamtrack_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run migrations
        run: pnpm --filter @teamtrack/database prisma migrate deploy
        env:
          DATABASE_URL: postgresql://teamtrack:password@localhost:5432/teamtrack_test
      
      - name: Run backend tests
        run: pnpm --filter @teamtrack/api test:cov
        env:
          DATABASE_URL: postgresql://teamtrack:password@localhost:5432/teamtrack_test
      
      - name: Run frontend tests
        run: pnpm --filter @teamtrack/web test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info,./apps/web/coverage/lcov.info
```

---

## Test Data Factories

**test/factories/task.factory.ts:**
```typescript
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export class TaskFactory {
  constructor(private prisma: PrismaClient) {}
  
  async createTask(teamId: string, projectId: string, overrides = {}) {
    return this.prisma.task.create({
      data: {
        teamId,
        projectId,
        title: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        priority: 'MEDIUM',
        status: 'TODO',
        weight: 1,
        createdBy: faker.string.uuid(),
        ...overrides,
      },
    });
  }
  
  async createTaskWithAssignees(
    teamId: string,
    projectId: string,
    assigneeCount = 2
  ) {
    const task = await this.createTask(teamId, projectId);
    
    const weightPerAssignee = Math.floor(100 / assigneeCount);
    
    for (let i = 0; i < assigneeCount; i++) {
      const user = await this.prisma.user.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName(),
          passwordHash: 'hashed',
        },
      });
      
      const teamMember = await this.prisma.teamMember.create({
        data: {
          teamId,
          userId: user.id,
          role: 'MEMBER',
        },
      });
      
      await this.prisma.taskAssignee.create({
        data: {
          teamId,
          taskId: task.id,
          teamMemberId: teamMember.id,
          allocatedWeight: i === assigneeCount - 1
            ? 100 - weightPerAssignee * (assigneeCount - 1) // Last assignee gets remainder
            : weightPerAssignee,
        },
      });
    }
    
    return task;
  }
}
```

---

## Performance Testing

### Load Test with Artillery

**artillery.yml:**
```yaml
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  processor: "./auth-flow.js"

scenarios:
  - name: "Task creation workflow"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.token"
              as: "authToken"
      
      - post:
          url: "/api/v1/teams/{{ teamId }}/projects/{{ projectId }}/tasks"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            title: "Load test task"
            priority: "MEDIUM"
      
      - get:
          url: "/api/v1/teams/{{ teamId }}/projects/{{ projectId }}/tasks"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

**Run:**
```bash
artillery run artillery.yml
```

---

## Continuous Testing

### Pre-commit Hook

**.husky/pre-commit:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests for changed files
pnpm test --bail --findRelatedTests $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')
```

### Pre-push Hook

**.husky/pre-push:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run full test suite before push
pnpm test --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

---

**Last Updated:** 2026-11-13  
**Version:** 1.0.0

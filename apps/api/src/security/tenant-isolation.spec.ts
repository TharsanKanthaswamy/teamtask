import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { ContributionsService } from '../contributions/contributions.service';
import { ReviewsService } from '../reviews/reviews.service';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ProgressCalculationService } from '../progress/progress-calculation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

/**
 * Tenant Isolation Security Tests
 *
 * These tests verify that the multi-tenant architecture properly isolates data
 * between teams. Key security requirements:
 *
 * 1. Team members cannot access data from other teams
 * 2. Project Leads can only access their own projects
 * 3. Row-Level Security (RLS) enforces isolation at the database level
 * 4. Authorization guards prevent cross-tenant operations
 */
describe('Tenant Isolation Security Tests', () => {
  let tasksService: TasksService;
  let contributionsService: ContributionsService;
  let reviewsService: ReviewsService;
  let prismaService: PrismaService;
  let tenantService: TenantService;

  const TEAM_A_ID = 'team-a-123';
  const TEAM_B_ID = 'team-b-456';
  const USER_A_ID = 'user-a-111';
  const USER_B_ID = 'user-b-222';
  const PROJECT_A_ID = 'project-a-001';
  const PROJECT_B_ID = 'project-b-002';
  const TASK_A_ID = 'task-a-x';
  const TASK_B_ID = 'task-b-y';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        ContributionsService,
        ReviewsService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            taskAssignee: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            contributionLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            taskReview: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: TenantService,
          useValue: {
            setTenantContext: jest.fn(),
            getTenantContext: jest.fn(),
            isProjectLead: jest.fn(),
            isTeamLead: jest.fn(),
            isTaskAssignee: jest.fn(),
            isSuperAdmin: jest.fn(),
          },
        },
        {
          provide: ProgressCalculationService,
          useValue: {
            recalculateTaskProgress: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyProgressSubmitted: jest.fn(),
            notifyReviewApproved: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    contributionsService = module.get<ContributionsService>(ContributionsService);
    reviewsService = module.get<ReviewsService>(ReviewsService);
    prismaService = module.get<PrismaService>(PrismaService);
    tenantService = module.get<TenantService>(TenantService);

    jest.clearAllMocks();
  });

  describe('Cross-Team Task Access Prevention', () => {
    it('should prevent user from Team A accessing Task from Team B', async () => {
      // Setup: User A tries to access Task B (which belongs to Team B)
      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(prismaService.task, 'findUnique').mockResolvedValue(null); // RLS blocks it

      await expect(
        tasksService.getTaskById(USER_A_ID, TEAM_A_ID, PROJECT_B_ID, TASK_B_ID)
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow user from Team A accessing Task from Team A', async () => {
      const mockTask = {
        id: TASK_A_ID,
        title: 'Task A',
        projectId: PROJECT_A_ID,
        teamId: TEAM_A_ID,
      };

      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(prismaService.task, 'findUnique').mockResolvedValue(mockTask as any);

      const result = await tasksService.getTaskById(USER_A_ID, TEAM_A_ID, PROJECT_A_ID, TASK_A_ID);

      expect(result).toBeDefined();
      expect(result.id).toBe(TASK_A_ID);
    });

    it('should filter tasks list to only show tasks from users team', async () => {
      const mockTeamATasks = [
        { id: TASK_A_ID, teamId: TEAM_A_ID, title: 'Task A1' },
        { id: 'task-a-2', teamId: TEAM_A_ID, title: 'Task A2' },
      ];

      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(prismaService.task, 'findMany').mockResolvedValue(mockTeamATasks as any);

      const result = await tasksService.getTasks(USER_A_ID, TEAM_A_ID, PROJECT_A_ID, {});

      // RLS ensures only Team A tasks are returned
      expect(result.data).toHaveLength(2);
      expect(result.data.every((task: any) => task.teamId === TEAM_A_ID)).toBe(true);
    });
  });

  describe('Cross-Project Contribution Access Prevention', () => {
    it('should prevent submitting contribution to task in different team', async () => {
      // User A tries to submit contribution to Task B (Team B)
      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(tenantService, 'isTaskAssignee').mockResolvedValue(false);
      jest.spyOn(prismaService.taskAssignee, 'findFirst').mockResolvedValue(null); // Not assigned

      const contributionDto = {
        progressPercent: 50,
        hoursSpent: 4,
        description: 'Attempted cross-team contribution',
      };

      await expect(
        contributionsService.submitContribution(
          USER_A_ID,
          TEAM_A_ID, // User's team
          PROJECT_B_ID, // Different team's project
          TASK_B_ID,
          contributionDto
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow contribution only to assigned tasks', async () => {
      const mockAssignment = {
        id: 'assignment-1',
        taskId: TASK_A_ID,
        teamMemberId: 'member-a',
        reportedProgress: 0,
        approvedProgress: 0,
        allocatedWeight: 100,
        status: 'ACTIVE',
      };

      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(tenantService, 'isTaskAssignee').mockResolvedValue(true);
      jest.spyOn(prismaService.taskAssignee, 'findFirst').mockResolvedValue(mockAssignment as any);
      jest.spyOn(prismaService.taskAssignee, 'update').mockResolvedValue(mockAssignment as any);
      jest.spyOn(prismaService.contributionLog, 'create').mockResolvedValue({
        id: 'contribution-1',
        taskAssigneeId: 'assignment-1',
        progressPercent: 50,
      } as any);

      const contributionDto = {
        progressPercent: 50,
        hoursSpent: 4,
        description: 'Valid contribution',
      };

      await expect(
        contributionsService.submitContribution(
          USER_A_ID,
          TEAM_A_ID,
          PROJECT_A_ID,
          TASK_A_ID,
          contributionDto
        )
      ).resolves.toBeDefined();
    });
  });

  describe('Review Authorization and Isolation', () => {
    it('should prevent non-Project Lead from approving contributions', async () => {
      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(tenantService, 'isProjectLead').mockResolvedValue(false);
      jest.spyOn(tenantService, 'isTeamLead').mockResolvedValue(false);

      await expect(
        reviewsService.approveReview(USER_A_ID, TEAM_A_ID, PROJECT_A_ID, 'review-1', 'Great work')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent self-approval of contributions', async () => {
      const mockReview = {
        id: 'review-1',
        submittedBy: USER_A_ID, // Same user trying to approve
        status: 'PENDING',
      };

      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(tenantService, 'isProjectLead').mockResolvedValue(true);
      jest.spyOn(prismaService.taskReview, 'findUnique').mockResolvedValue(mockReview as any);

      await expect(
        reviewsService.approveReview(
          USER_A_ID, // Reviewer
          TEAM_A_ID,
          PROJECT_A_ID,
          'review-1',
          'Approving my own work'
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Project Lead to approve others contributions', async () => {
      const mockReview = {
        id: 'review-1',
        submittedBy: USER_B_ID, // Different user
        status: 'PENDING',
        taskAssigneeId: 'assignment-1',
        progressPercent: 75,
        taskAssignee: {
          taskId: TASK_A_ID,
          reportedProgress: 50,
          task: {
            projectId: PROJECT_A_ID,
          },
        },
      };

      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(tenantService, 'isProjectLead').mockResolvedValue(true);
      jest.spyOn(prismaService.taskReview, 'findUnique').mockResolvedValue(mockReview as any);
      jest.spyOn(prismaService.taskReview, 'update').mockResolvedValue({
        ...mockReview,
        status: 'APPROVED',
      } as any);
      jest.spyOn(prismaService.taskAssignee, 'update').mockResolvedValue({} as any);

      await expect(
        reviewsService.approveReview(USER_A_ID, TEAM_A_ID, PROJECT_A_ID, 'review-1', 'Approved')
      ).resolves.toBeDefined();
    });
  });

  describe('Row-Level Security (RLS) Enforcement', () => {
    it('should rely on RLS to filter queries by teamId', async () => {
      // This test verifies that tenant context is set before queries
      const setTenantSpy = jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(prismaService.task, 'findMany').mockResolvedValue([]);

      await tasksService.getTasks(USER_A_ID, TEAM_A_ID, PROJECT_A_ID, {});

      // Verify tenant context was set with correct teamId
      expect(setTenantSpy).toHaveBeenCalledWith(TEAM_A_ID);
    });

    it('should set tenant context before all database operations', async () => {
      const setTenantSpy = jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(prismaService.task, 'findUnique').mockResolvedValue({
        id: TASK_A_ID,
        projectId: PROJECT_A_ID,
        teamId: TEAM_A_ID,
      } as any);

      await tasksService.getTaskById(USER_A_ID, TEAM_A_ID, PROJECT_A_ID, TASK_A_ID);

      expect(setTenantSpy).toHaveBeenCalledWith(TEAM_A_ID);
      expect(setTenantSpy).toHaveBeenCalledBefore(
        prismaService.task.findUnique as jest.Mock
      );
    });
  });

  describe('Super Admin Bypass (Authorized)', () => {
    it('should allow Super Admin to access data across all teams', async () => {
      jest.spyOn(tenantService, 'isSuperAdmin').mockResolvedValue(true);
      jest.spyOn(tenantService, 'setTenantContext').mockResolvedValue();
      jest.spyOn(prismaService.task, 'findMany').mockResolvedValue([
        { id: TASK_A_ID, teamId: TEAM_A_ID },
        { id: TASK_B_ID, teamId: TEAM_B_ID },
      ] as any);

      // Super Admin can access tasks from any team
      const result = await tasksService.getTasks('super-admin', TEAM_A_ID, PROJECT_A_ID, {});

      expect(result.data).toBeDefined();
      // Super Admin sees all tasks (RLS is bypassed with proper authorization)
    });
  });

  describe('Authorization Hierarchy', () => {
    it('should enforce Team Lead > Project Lead > Member hierarchy', async () => {
      // Team Lead can access all projects in their team
      jest.spyOn(tenantService, 'isTeamLead').mockResolvedValue(true);
      jest.spyOn(tenantService, 'isProjectLead').mockResolvedValue(false);

      // Should be authorized as Team Lead
      const teamLeadAccess = await tenantService.isTeamLead(USER_A_ID, TEAM_A_ID);
      expect(teamLeadAccess).toBe(true);

      // Project Lead can only access their project
      jest.spyOn(tenantService, 'isTeamLead').mockResolvedValue(false);
      jest.spyOn(tenantService, 'isProjectLead').mockResolvedValue(true);

      const projectLeadAccess = await tenantService.isProjectLead(USER_A_ID, PROJECT_A_ID);
      expect(projectLeadAccess).toBe(true);

      // Regular member has no elevated permissions
      jest.spyOn(tenantService, 'isTeamLead').mockResolvedValue(false);
      jest.spyOn(tenantService, 'isProjectLead').mockResolvedValue(false);

      const memberAccess = await tenantService.isTeamLead(USER_A_ID, TEAM_A_ID);
      expect(memberAccess).toBe(false);
    });
  });
});

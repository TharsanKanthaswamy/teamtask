import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TaskAssignmentsService } from './task-assignments.service';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

describe('TaskAssignmentsService', () => {
  let service: TaskAssignmentsService;
  let prismaService: PrismaService;

  const mockPrisma = {
    taskAssignee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
    },
    teamMember: {
      findUnique: jest.fn(),
    },
  };

  const mockTenantService = {
    setTenantContext: jest.fn(),
    getTenantContext: jest.fn(),
    isProjectLead: jest.fn(),
    isTeamLead: jest.fn(),
  };

  const mockNotificationsService = {
    notifyTaskAssigned: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskAssignmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TenantService, useValue: mockTenantService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TaskAssignmentsService>(TaskAssignmentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('weight allocation validation', () => {
    it('should reject assignment when total weight would exceed 100%', async () => {
      const mockExistingAssignees = [
        { allocatedWeight: 60, status: 'ACTIVE' },
        { allocatedWeight: 30, status: 'ACTIVE' },
      ];

      mockPrisma.taskAssignee.findMany.mockResolvedValue(mockExistingAssignees);
      mockPrisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'proj-1' });
      mockPrisma.teamMember.findUnique.mockResolvedValue({ id: 'member-1', userId: 'user-1' });
      mockTenantService.isProjectLead.mockResolvedValue(true);

      const assignDto = {
        taskId: 'task-1',
        teamMemberId: 'member-3',
        allocatedWeight: 20, // Total would be 110%
      };

      await expect(service.assignTask('user-1', 'team-1', 'proj-1', assignDto))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should allow assignment when total weight equals 100%', async () => {
      const mockExistingAssignees = [
        { allocatedWeight: 70, status: 'ACTIVE' },
      ];

      mockPrisma.taskAssignee.findMany.mockResolvedValue(mockExistingAssignees);
      mockPrisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'proj-1' });
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-2',
        userId: 'user-2',
        user: { id: 'user-2', name: 'Test User' }
      });
      mockTenantService.isProjectLead.mockResolvedValue(true);
      mockPrisma.taskAssignee.create.mockResolvedValue({
        id: 'assignee-1',
        taskId: 'task-1',
        teamMemberId: 'member-2',
        allocatedWeight: 30,
        status: 'ACTIVE',
      });

      const assignDto = {
        taskId: 'task-1',
        teamMemberId: 'member-2',
        allocatedWeight: 30, // Total = 100%
      };

      const result = await service.assignTask('user-1', 'team-1', 'proj-1', assignDto);

      expect(result).toBeDefined();
      expect(mockPrisma.taskAssignee.create).toHaveBeenCalled();
    });

    it('should exclude inactive assignees from weight calculation', async () => {
      const mockExistingAssignees = [
        { allocatedWeight: 50, status: 'ACTIVE' },
        { allocatedWeight: 50, status: 'REMOVED' }, // Should be excluded
      ];

      mockPrisma.taskAssignee.findMany.mockResolvedValue(mockExistingAssignees);
      mockPrisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'proj-1' });
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-3',
        userId: 'user-3',
        user: { id: 'user-3', name: 'Test User' }
      });
      mockTenantService.isProjectLead.mockResolvedValue(true);
      mockPrisma.taskAssignee.create.mockResolvedValue({
        id: 'assignee-2',
        taskId: 'task-1',
        teamMemberId: 'member-3',
        allocatedWeight: 50,
        status: 'ACTIVE',
      });

      const assignDto = {
        taskId: 'task-1',
        teamMemberId: 'member-3',
        allocatedWeight: 50, // Should be valid because REMOVED doesn't count
      };

      await expect(service.assignTask('user-1', 'team-1', 'proj-1', assignDto))
        .resolves
        .toBeDefined();
    });
  });

  describe('weight update validation', () => {
    it('should allow weight update within remaining allocation', async () => {
      const mockExistingAssignees = [
        { id: 'assignee-1', allocatedWeight: 40, status: 'ACTIVE' },
        { id: 'assignee-2', allocatedWeight: 30, status: 'ACTIVE' },
      ];

      mockPrisma.taskAssignee.findMany.mockResolvedValue(mockExistingAssignees);
      mockPrisma.taskAssignee.findFirst.mockResolvedValue({
        id: 'assignee-1',
        taskId: 'task-1',
        task: { projectId: 'proj-1' },
      });
      mockTenantService.isProjectLead.mockResolvedValue(true);
      mockPrisma.taskAssignee.update.mockResolvedValue({
        id: 'assignee-1',
        allocatedWeight: 50,
      });

      const updateDto = {
        allocatedWeight: 50, // Increase by 10, total would be 80%
      };

      const result = await service.updateWeight('user-1', 'team-1', 'assignee-1', updateDto);

      expect(result).toBeDefined();
      expect(mockPrisma.taskAssignee.update).toHaveBeenCalled();
    });

    it('should reject weight update that exceeds 100%', async () => {
      const mockExistingAssignees = [
        { id: 'assignee-1', allocatedWeight: 40, status: 'ACTIVE' },
        { id: 'assignee-2', allocatedWeight: 50, status: 'ACTIVE' },
      ];

      mockPrisma.taskAssignee.findMany.mockResolvedValue(mockExistingAssignees);
      mockPrisma.taskAssignee.findFirst.mockResolvedValue({
        id: 'assignee-1',
        taskId: 'task-1',
        task: { projectId: 'proj-1' },
      });
      mockTenantService.isProjectLead.mockResolvedValue(true);

      const updateDto = {
        allocatedWeight: 60, // Would make total 110%
      };

      await expect(service.updateWeight('user-1', 'team-1', 'assignee-1', updateDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('authorization', () => {
    it('should allow Project Lead to assign tasks', async () => {
      mockTenantService.isProjectLead.mockResolvedValue(true);
      mockTenantService.isTeamLead.mockResolvedValue(false);
      mockPrisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'proj-1' });
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User' }
      });
      mockPrisma.taskAssignee.findMany.mockResolvedValue([]);
      mockPrisma.taskAssignee.create.mockResolvedValue({
        id: 'assignee-1',
        taskId: 'task-1',
        teamMemberId: 'member-1',
        allocatedWeight: 100,
        status: 'ACTIVE',
      });

      const assignDto = {
        taskId: 'task-1',
        teamMemberId: 'member-1',
        allocatedWeight: 100,
      };

      await expect(service.assignTask('user-pl', 'team-1', 'proj-1', assignDto))
        .resolves
        .toBeDefined();
    });

    it('should allow Team Lead to assign tasks', async () => {
      mockTenantService.isProjectLead.mockResolvedValue(false);
      mockTenantService.isTeamLead.mockResolvedValue(true);
      mockPrisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'proj-1' });
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User' }
      });
      mockPrisma.taskAssignee.findMany.mockResolvedValue([]);
      mockPrisma.taskAssignee.create.mockResolvedValue({
        id: 'assignee-1',
        taskId: 'task-1',
        teamMemberId: 'member-1',
        allocatedWeight: 100,
        status: 'ACTIVE',
      });

      const assignDto = {
        taskId: 'task-1',
        teamMemberId: 'member-1',
        allocatedWeight: 100,
      };

      await expect(service.assignTask('user-tl', 'team-1', 'proj-1', assignDto))
        .resolves
        .toBeDefined();
    });

    it('should reject assignment from regular team member', async () => {
      mockTenantService.isProjectLead.mockResolvedValue(false);
      mockTenantService.isTeamLead.mockResolvedValue(false);
      mockPrisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'proj-1' });

      const assignDto = {
        taskId: 'task-1',
        teamMemberId: 'member-1',
        allocatedWeight: 100,
      };

      await expect(service.assignTask('user-member', 'team-1', 'proj-1', assignDto))
        .rejects
        .toThrow(ForbiddenException);
    });
  });
});

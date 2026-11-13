import { Test, TestingModule } from '@nestjs/testing';
import { ProgressCalculationService } from './progress-calculation.service';
import { PrismaService } from '../database/prisma.service';

describe('ProgressCalculationService', () => {
  let service: ProgressCalculationService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressCalculationService,
        {
          provide: PrismaService,
          useValue: {
            taskAssignee: {
              findMany: jest.fn(),
            },
            task: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProgressCalculationService>(ProgressCalculationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateIndividualContribution', () => {
    it('should calculate contribution correctly: C_i = W_i × P_i / 100', () => {
      // Test case 1: 50% weight, 100% progress = 50% contribution
      expect(service.calculateIndividualContribution(50, 100)).toBe(50);

      // Test case 2: 30% weight, 60% progress = 18% contribution
      expect(service.calculateIndividualContribution(30, 60)).toBe(18);

      // Test case 3: 100% weight, 50% progress = 50% contribution
      expect(service.calculateIndividualContribution(100, 50)).toBe(50);

      // Test case 4: 25% weight, 80% progress = 20% contribution
      expect(service.calculateIndividualContribution(25, 80)).toBe(20);

      // Test case 5: 0% progress = 0% contribution
      expect(service.calculateIndividualContribution(50, 0)).toBe(0);
    });

    it('should handle edge cases', () => {
      // Zero weight
      expect(service.calculateIndividualContribution(0, 100)).toBe(0);

      // Zero progress
      expect(service.calculateIndividualContribution(100, 0)).toBe(0);

      // Full contribution
      expect(service.calculateIndividualContribution(100, 100)).toBe(100);
    });
  });

  describe('calculateTaskProgress', () => {
    it('should calculate task progress from multiple assignees', async () => {
      const mockAssignees = [
        { allocatedWeight: 40, reportedProgress: 75, approvedProgress: 50 },
        { allocatedWeight: 30, reportedProgress: 100, approvedProgress: 100 },
        { allocatedWeight: 30, reportedProgress: 60, approvedProgress: 40 },
      ];

      jest.spyOn(prismaService.taskAssignee, 'findMany').mockResolvedValue(mockAssignees as any);

      const result = await service.calculateTaskProgress('task-123');

      // Reported: (40 × 75 / 100) + (30 × 100 / 100) + (30 × 60 / 100) = 30 + 30 + 18 = 78%
      expect(result.reportedProgress).toBe(78);

      // Approved: (40 × 50 / 100) + (30 × 100 / 100) + (30 × 40 / 100) = 20 + 30 + 12 = 62%
      expect(result.approvedProgress).toBe(62);
    });

    it('should handle single assignee', async () => {
      const mockAssignees = [
        { allocatedWeight: 100, reportedProgress: 80, approvedProgress: 75 },
      ];

      jest.spyOn(prismaService.taskAssignee, 'findMany').mockResolvedValue(mockAssignees as any);

      const result = await service.calculateTaskProgress('task-456');

      expect(result.reportedProgress).toBe(80);
      expect(result.approvedProgress).toBe(75);
    });

    it('should return 0 for task with no assignees', async () => {
      jest.spyOn(prismaService.taskAssignee, 'findMany').mockResolvedValue([]);

      const result = await service.calculateTaskProgress('task-789');

      expect(result.reportedProgress).toBe(0);
      expect(result.approvedProgress).toBe(0);
    });

    it('should round progress to nearest integer', async () => {
      const mockAssignees = [
        { allocatedWeight: 33, reportedProgress: 100, approvedProgress: 100 },
        { allocatedWeight: 33, reportedProgress: 100, approvedProgress: 100 },
        { allocatedWeight: 34, reportedProgress: 100, approvedProgress: 100 },
      ];

      jest.spyOn(prismaService.taskAssignee, 'findMany').mockResolvedValue(mockAssignees as any);

      const result = await service.calculateTaskProgress('task-round');

      // (33 + 33 + 34) = 100, should round properly
      expect(result.reportedProgress).toBe(100);
      expect(result.approvedProgress).toBe(100);
    });
  });

  describe('recalculateTaskProgress', () => {
    it('should update task to COMPLETED when all assignees reach 100%', async () => {
      const mockAssignees = [
        { allocatedWeight: 50, reportedProgress: 100, approvedProgress: 100 },
        { allocatedWeight: 50, reportedProgress: 100, approvedProgress: 100 },
      ];

      jest.spyOn(prismaService.taskAssignee, 'findMany').mockResolvedValue(mockAssignees as any);
      const updateSpy = jest.spyOn(prismaService.task, 'update').mockResolvedValue({} as any);

      await service.recalculateTaskProgress('task-complete');

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'task-complete' },
        data: { status: 'COMPLETED' },
      });
    });

    it('should not update task when progress is incomplete', async () => {
      const mockAssignees = [
        { allocatedWeight: 50, reportedProgress: 100, approvedProgress: 100 },
        { allocatedWeight: 50, reportedProgress: 80, approvedProgress: 70 },
      ];

      jest.spyOn(prismaService.taskAssignee, 'findMany').mockResolvedValue(mockAssignees as any);
      const updateSpy = jest.spyOn(prismaService.task, 'update');

      await service.recalculateTaskProgress('task-incomplete');

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should not update when approved progress is 100% but not all assignees at 100%', async () => {
      // Edge case: weighted total is 100% but one assignee not at 100%
      const mockAssignees = [
        { allocatedWeight: 80, reportedProgress: 100, approvedProgress: 100 },
        { allocatedWeight: 20, reportedProgress: 100, approvedProgress: 100 },
      ];

      jest.spyOn(prismaService.taskAssignee, 'findMany').mockResolvedValue(mockAssignees as any);
      const updateSpy = jest.spyOn(prismaService.task, 'update').mockResolvedValue({} as any);

      await service.recalculateTaskProgress('task-edge');

      // Should update because all assignees ARE at 100%
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('weight allocation validation', () => {
    it('should correctly sum weights to validate 100% allocation', async () => {
      const mockAssignees = [
        { allocatedWeight: 25, reportedProgress: 0, approvedProgress: 0 },
        { allocatedWeight: 25, reportedProgress: 0, approvedProgress: 0 },
        { allocatedWeight: 25, reportedProgress: 0, approvedProgress: 0 },
        { allocatedWeight: 25, reportedProgress: 0, approvedProgress: 0 },
      ];

      jest.spyOn(prismaService.taskAssignee, 'findMany').mockResolvedValue(mockAssignees as any);

      const result = await service.calculateTaskProgress('task-weights');

      // Weights sum to 100%, progress should calculate correctly
      expect(result.reportedProgress).toBe(0);
      expect(result.approvedProgress).toBe(0);
    });
  });
});

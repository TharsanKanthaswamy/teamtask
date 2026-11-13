import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Integration Test: Complete Task Management Workflow
 *
 * This test covers the end-to-end workflow:
 * 1. Create a task
 * 2. Assign team members with weight allocation
 * 3. Submit progress contributions
 * 4. Review and approve contributions
 * 5. Verify progress calculations
 * 6. Auto-completion when all assignees reach 100%
 */
describe('Task Workflow Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data IDs
  const TEAM_ID = 'test-team-workflow';
  const PROJECT_ID = 'test-project-workflow';
  const USER_PROJECT_LEAD_ID = 'user-pl-workflow';
  const USER_MEMBER_1_ID = 'user-m1-workflow';
  const USER_MEMBER_2_ID = 'user-m2-workflow';

  let taskId: string;
  let assignee1Id: string;
  let assignee2Id: string;
  let contribution1Id: string;
  let contribution2Id: string;
  let review1Id: string;

  beforeAll(async () => {
    // Note: In real implementation, would import AppModule and set up properly
    // This is a template for the integration test structure
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$disconnect();
    await app.close();
  });

  describe('End-to-End Task Workflow', () => {
    it('Step 1: Project Lead creates a new task', async () => {
      const createTaskDto = {
        title: 'Implement feature X',
        description: 'Build the feature with proper testing',
        priority: 'HIGH',
        status: 'TODO',
        weight: 50,
        estimatedHours: 16,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks`)
        .send(createTaskDto)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(createTaskDto.title);
      expect(response.body.data.status).toBe('TODO');

      taskId = response.body.data.id;
    });

    it('Step 2: Project Lead assigns two team members with 60/40 weight split', async () => {
      // Assign Member 1 with 60% weight
      const assign1Response = await request(app.getHttpServer())
        .post(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}/assign`)
        .send({
          teamMemberId: USER_MEMBER_1_ID,
          allocatedWeight: 60,
          responsibility: 'Backend implementation',
        })
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(201);

      assignee1Id = assign1Response.body.data.id;

      // Assign Member 2 with 40% weight
      const assign2Response = await request(app.getHttpServer())
        .post(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}/assign`)
        .send({
          teamMemberId: USER_MEMBER_2_ID,
          allocatedWeight: 40,
          responsibility: 'Frontend implementation',
        })
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(201);

      assignee2Id = assign2Response.body.data.id;

      // Verify total weight equals 100%
      const taskResponse = await request(app.getHttpServer())
        .get(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      const assignees = taskResponse.body.data.assignees;
      const totalWeight = assignees.reduce((sum: number, a: any) => sum + a.allocatedWeight, 0);
      expect(totalWeight).toBe(100);
    });

    it('Step 3: Member 1 submits 50% progress contribution', async () => {
      const contributionDto = {
        progressPercent: 50,
        hoursSpent: 4,
        description: 'Completed backend API endpoints',
        evidenceUrl: 'https://github.com/org/repo/pull/123',
      };

      const response = await request(app.getHttpServer())
        .post(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}/contributions`)
        .send(contributionDto)
        .set('Authorization', `Bearer ${USER_MEMBER_1_ID}`)
        .expect(201);

      contribution1Id = response.body.data.id;

      // Verify contribution was recorded
      expect(response.body.data.progressPercent).toBe(50);
      expect(response.body.data.hoursSpent).toBe(4);
    });

    it('Step 4: Verify task progress calculation after first contribution', async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      const task = response.body.data;

      // Member 1: 60% weight × 50% progress = 30% contribution
      // Member 2: 40% weight × 0% progress = 0% contribution
      // Total reported progress = 30%
      expect(task.reportedProgress).toBe(30);
      expect(task.approvedProgress).toBe(0); // Not yet approved
    });

    it('Step 5: Project Lead approves Member 1 contribution', async () => {
      // Get review ID (would be created automatically)
      const reviewsResponse = await request(app.getHttpServer())
        .get(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/reviews/pending`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      review1Id = reviewsResponse.body.data[0].id;

      // Approve the review
      const approveResponse = await request(app.getHttpServer())
        .patch(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/reviews/${review1Id}/approve`)
        .send({ feedback: 'Great work on the API!' })
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      expect(approveResponse.body.data.status).toBe('APPROVED');
    });

    it('Step 6: Verify approved progress after review', async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      const task = response.body.data;

      // After approval: 60% × 50% = 30% approved progress
      expect(task.approvedProgress).toBe(30);
    });

    it('Step 7: Member 2 submits 100% progress contribution', async () => {
      const contributionDto = {
        progressPercent: 100,
        hoursSpent: 6,
        description: 'Completed UI components and integration',
        evidenceUrl: 'https://github.com/org/repo/pull/124',
      };

      await request(app.getHttpServer())
        .post(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}/contributions`)
        .send(contributionDto)
        .set('Authorization', `Bearer ${USER_MEMBER_2_ID}`)
        .expect(201);
    });

    it('Step 8: Member 1 updates progress to 100%', async () => {
      const contributionDto = {
        progressPercent: 100,
        hoursSpent: 4,
        description: 'Added error handling and tests',
      };

      await request(app.getHttpServer())
        .post(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}/contributions`)
        .send(contributionDto)
        .set('Authorization', `Bearer ${USER_MEMBER_1_ID}`)
        .expect(201);

      // Verify reported progress
      const taskResponse = await request(app.getHttpServer())
        .get(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      // 60% × 100% + 40% × 100% = 100% reported
      expect(taskResponse.body.data.reportedProgress).toBe(100);
    });

    it('Step 9: Project Lead approves remaining contributions', async () => {
      const reviewsResponse = await request(app.getHttpServer())
        .get(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/reviews/pending`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      // Approve all pending reviews
      for (const review of reviewsResponse.body.data) {
        await request(app.getHttpServer())
          .patch(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/reviews/${review.id}/approve`)
          .send({ feedback: 'Approved' })
          .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
          .expect(200);
      }
    });

    it('Step 10: Verify task auto-completes when all progress approved', async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      const task = response.body.data;

      // All assignees at 100% approved
      expect(task.approvedProgress).toBe(100);

      // Task should auto-complete
      expect(task.status).toBe('COMPLETED');
    });

    it('Step 11: Verify contribution history is immutable', async () => {
      const historyResponse = await request(app.getHttpServer())
        .get(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}/contributions`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      const contributions = historyResponse.body.data;

      // Should have 3 contributions total (Member 1: 2, Member 2: 1)
      expect(contributions.length).toBeGreaterThanOrEqual(3);

      // All contributions should be immutable (have timestamps)
      contributions.forEach((c: any) => {
        expect(c.submittedAt).toBeDefined();
        expect(c.id).toBeDefined();
      });
    });

    it('Step 12: Verify analytics reflect completion', async () => {
      const analyticsResponse = await request(app.getHttpServer())
        .get(`/analytics/projects/${PROJECT_ID}`)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(200);

      const analytics = analyticsResponse.body.data;

      expect(analytics.progress.completedTasks).toBeGreaterThan(0);
      expect(analytics.contributors).toHaveLength(2);

      // Verify each contributor's progress
      const contributor1 = analytics.contributors.find(
        (c: any) => c.userId === USER_MEMBER_1_ID
      );
      const contributor2 = analytics.contributors.find(
        (c: any) => c.userId === USER_MEMBER_2_ID
      );

      expect(contributor1.approvedCompletion).toBe(100);
      expect(contributor2.approvedCompletion).toBe(100);
    });
  });

  describe('Progress Decrease Prevention', () => {
    it('should reject contribution with decreased progress', async () => {
      // After submitting 50%, try to submit 30%
      const contributionDto = {
        progressPercent: 30, // Decreased from 50%
        hoursSpent: 2,
        description: 'Attempt to decrease progress',
      };

      await request(app.getHttpServer())
        .post(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}/contributions`)
        .send(contributionDto)
        .set('Authorization', `Bearer ${USER_MEMBER_1_ID}`)
        .expect(400); // BadRequestException
    });
  });

  describe('Weight Validation', () => {
    it('should reject assignment that exceeds 100% total weight', async () => {
      const assignDto = {
        teamMemberId: 'another-member',
        allocatedWeight: 20, // Would exceed 100%
      };

      await request(app.getHttpServer())
        .post(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/tasks/${taskId}/assign`)
        .send(assignDto)
        .set('Authorization', `Bearer ${USER_PROJECT_LEAD_ID}`)
        .expect(400);
    });
  });

  describe('Self-Approval Prevention', () => {
    it('should reject when user tries to approve their own contribution', async () => {
      // Member 1 tries to approve their own work
      await request(app.getHttpServer())
        .patch(`/teams/${TEAM_ID}/projects/${PROJECT_ID}/reviews/${review1Id}/approve`)
        .send({ feedback: 'Self approval attempt' })
        .set('Authorization', `Bearer ${USER_MEMBER_1_ID}`) // Same user who submitted
        .expect(403); // ForbiddenException
    });
  });
});

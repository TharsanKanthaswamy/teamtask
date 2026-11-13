-- Add task management enums
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'CHANGES_REQUESTED', 'COMPLETED', 'BLOCKED', 'CANCELLED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED');
CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_UPDATED', 'CONTRIBUTION_SUBMITTED', 'REVIEW_PENDING', 'WORK_APPROVED', 'CHANGES_REQUESTED', 'DEADLINE_APPROACHING', 'TASK_OVERDUE', 'PROJECT_LEAD_CHANGED', 'PROJECT_MEMBERSHIP_CHANGED');

-- Extend AuditAction enum
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_TASK';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_TASK';
ALTER TYPE "AuditAction" ADD VALUE 'ASSIGN_TASK';
ALTER TYPE "AuditAction" ADD VALUE 'UNASSIGN_TASK';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMIT_CONTRIBUTION';
ALTER TYPE "AuditAction" ADD VALUE 'APPROVE_CONTRIBUTION';
ALTER TYPE "AuditAction" ADD VALUE 'REJECT_CONTRIBUTION';
ALTER TYPE "AuditAction" ADD VALUE 'REQUEST_CHANGES';

-- CreateTable: tasks
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "milestone_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "weight" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMPTZ(3),
    "due_date" TIMESTAMPTZ(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_assignees
CREATE TABLE "task_assignees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "team_member_id" UUID NOT NULL,
    "responsibility" TEXT,
    "allocated_weight" INTEGER NOT NULL DEFAULT 100,
    "reported_progress" INTEGER NOT NULL DEFAULT 0,
    "approved_progress" INTEGER NOT NULL DEFAULT 0,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable: contribution_logs
CREATE TABLE "contribution_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "task_assignee_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "progress_percent" INTEGER NOT NULL,
    "hours_spent" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "evidence_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contribution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_reviews
CREATE TABLE "task_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "task_assignee_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "reviewer_id" UUID,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "task_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable: notifications
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_team_id_idx" ON "tasks"("team_id");
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");
CREATE INDEX "tasks_milestone_id_idx" ON "tasks"("milestone_id");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

CREATE INDEX "task_assignees_team_id_idx" ON "task_assignees"("team_id");
CREATE INDEX "task_assignees_task_id_idx" ON "task_assignees"("task_id");
CREATE INDEX "task_assignees_team_member_id_idx" ON "task_assignees"("team_member_id");
CREATE UNIQUE INDEX "task_assignees_task_id_team_member_id_key" ON "task_assignees"("task_id", "team_member_id");

CREATE INDEX "contribution_logs_team_id_idx" ON "contribution_logs"("team_id");
CREATE INDEX "contribution_logs_task_assignee_id_idx" ON "contribution_logs"("task_assignee_id");
CREATE INDEX "contribution_logs_created_at_idx" ON "contribution_logs"("created_at");

CREATE INDEX "task_reviews_team_id_idx" ON "task_reviews"("team_id");
CREATE INDEX "task_reviews_task_id_idx" ON "task_reviews"("task_id");
CREATE INDEX "task_reviews_task_assignee_id_idx" ON "task_reviews"("task_assignee_id");
CREATE INDEX "task_reviews_status_idx" ON "task_reviews"("status");
CREATE INDEX "task_reviews_submitted_at_idx" ON "task_reviews"("submitted_at");

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contribution_logs" ADD CONSTRAINT "contribution_logs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contribution_logs" ADD CONSTRAINT "contribution_logs_task_assignee_id_fkey" FOREIGN KEY ("task_assignee_id") REFERENCES "task_assignees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_task_assignee_id_fkey" FOREIGN KEY ("task_assignee_id") REFERENCES "task_assignees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row-Level Security on new tenant-scoped tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees FORCE ROW LEVEL SECURITY;

ALTER TABLE contribution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE task_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reviews FORCE ROW LEVEL SECURITY;

-- RLS Policy: Tasks
CREATE POLICY tasks_tenant_isolation ON tasks
    FOR ALL
    USING (
        is_super_admin() = TRUE OR team_id = get_current_team_id()
    );

-- RLS Policy: Task Assignees
CREATE POLICY task_assignees_tenant_isolation ON task_assignees
    FOR ALL
    USING (
        is_super_admin() = TRUE OR team_id = get_current_team_id()
    );

-- RLS Policy: Contribution Logs
CREATE POLICY contribution_logs_tenant_isolation ON contribution_logs
    FOR ALL
    USING (
        is_super_admin() = TRUE OR team_id = get_current_team_id()
    );

-- RLS Policy: Task Reviews
CREATE POLICY task_reviews_tenant_isolation ON task_reviews
    FOR ALL
    USING (
        is_super_admin() = TRUE OR team_id = get_current_team_id()
    );

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO teamtrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_assignees TO teamtrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON contribution_logs TO teamtrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_reviews TO teamtrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO teamtrack_app;

COMMENT ON POLICY tasks_tenant_isolation ON tasks IS 'Enforces team-level data isolation for tasks.';
COMMENT ON POLICY task_assignees_tenant_isolation ON task_assignees IS 'Enforces team-level data isolation for task assignees.';
COMMENT ON POLICY contribution_logs_tenant_isolation ON contribution_logs IS 'Enforces team-level data isolation for contribution logs.';
COMMENT ON POLICY task_reviews_tenant_isolation ON task_reviews IS 'Enforces team-level data isolation for task reviews.';

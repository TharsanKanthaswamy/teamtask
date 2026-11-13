-- Add project management enums
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- Extend AuditAction enum
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_PROJECT';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_PROJECT';
ALTER TYPE "AuditAction" ADD VALUE 'ARCHIVE_PROJECT';
ALTER TYPE "AuditAction" ADD VALUE 'ASSIGN_PROJECT_LEAD';
ALTER TYPE "AuditAction" ADD VALUE 'ADD_PROJECT_MEMBER';
ALTER TYPE "AuditAction" ADD VALUE 'REMOVE_PROJECT_MEMBER';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_MILESTONE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_MILESTONE';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_MILESTONE';

-- CreateTable: projects
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "objectives" TEXT,
    "project_lead_id" UUID NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "start_date" TIMESTAMPTZ(3),
    "target_end_date" TIMESTAMPTZ(3),
    "actual_end_date" TIMESTAMPTZ(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable: project_members
CREATE TABLE "project_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "team_member_id" UUID NOT NULL,
    "responsibility" TEXT,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: milestones
CREATE TABLE "milestones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMPTZ(3),
    "due_date" TIMESTAMPTZ(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "weight" INTEGER,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_team_id_idx" ON "projects"("team_id");
CREATE INDEX "projects_project_lead_id_idx" ON "projects"("project_lead_id");
CREATE INDEX "projects_status_idx" ON "projects"("status");
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");
CREATE UNIQUE INDEX "projects_team_id_slug_key" ON "projects"("team_id", "slug");

CREATE INDEX "project_members_team_id_idx" ON "project_members"("team_id");
CREATE INDEX "project_members_project_id_idx" ON "project_members"("project_id");
CREATE INDEX "project_members_team_member_id_idx" ON "project_members"("team_member_id");
CREATE UNIQUE INDEX "project_members_project_id_team_member_id_key" ON "project_members"("project_id", "team_member_id");

CREATE INDEX "milestones_team_id_idx" ON "milestones"("team_id");
CREATE INDEX "milestones_project_id_idx" ON "milestones"("project_id");
CREATE INDEX "milestones_sequence_idx" ON "milestones"("sequence");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_lead_id_fkey" FOREIGN KEY ("project_lead_id") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_members" ADD CONSTRAINT "project_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "milestones" ADD CONSTRAINT "milestones_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row-Level Security on new tenant-scoped tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members FORCE ROW LEVEL SECURITY;

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones FORCE ROW LEVEL SECURITY;

-- RLS Policy: Projects
CREATE POLICY projects_tenant_isolation ON projects
    FOR ALL
    USING (
        is_super_admin() = TRUE OR team_id = get_current_team_id()
    );

-- RLS Policy: Project Members
CREATE POLICY project_members_tenant_isolation ON project_members
    FOR ALL
    USING (
        is_super_admin() = TRUE OR team_id = get_current_team_id()
    );

-- RLS Policy: Milestones
CREATE POLICY milestones_tenant_isolation ON milestones
    FOR ALL
    USING (
        is_super_admin() = TRUE OR team_id = get_current_team_id()
    );

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO teamtrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_members TO teamtrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON milestones TO teamtrack_app;

COMMENT ON POLICY projects_tenant_isolation ON projects IS 'Enforces team-level data isolation for projects. Super Admins can access all teams; regular users can only access their current team context.';
COMMENT ON POLICY project_members_tenant_isolation ON project_members IS 'Enforces team-level data isolation for project members.';
COMMENT ON POLICY milestones_tenant_isolation ON milestones IS 'Enforces team-level data isolation for milestones.';

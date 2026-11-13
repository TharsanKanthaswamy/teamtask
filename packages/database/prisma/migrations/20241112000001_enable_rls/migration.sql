-- Enable Row-Level Security on tenant-scoped tables
-- This migration MUST run after the initial schema is created

-- Create role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'teamtrack_app') THEN
        CREATE ROLE teamtrack_app WITH LOGIN PASSWORD 'app_password_change_in_production';
    END IF;
END
$$;

-- Create helper functions for tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_team_id UUID, is_super_admin BOOLEAN DEFAULT FALSE)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_team_id', tenant_team_id::TEXT, TRUE);
    PERFORM set_config('app.is_super_admin', is_super_admin::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_team_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_team_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_super_admin', TRUE)::BOOLEAN, FALSE);
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions on tenant context functions
GRANT EXECUTE ON FUNCTION set_tenant_context(UUID, BOOLEAN) TO teamtrack_app;
GRANT EXECUTE ON FUNCTION get_current_team_id() TO teamtrack_app;
GRANT EXECUTE ON FUNCTION is_super_admin() TO teamtrack_app;

-- Enable RLS on team_members (tenant-scoped)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members FORCE ROW LEVEL SECURITY;

-- Policy: Users can only access team_members records for their current team context
-- Super Admins bypass this through is_super_admin() check
CREATE POLICY team_members_tenant_isolation ON team_members
    FOR ALL
    USING (
        is_super_admin() = TRUE OR team_id = get_current_team_id()
    );

-- Note: teams, users, sessions, platform_admins, audit_logs, and platform_settings
-- are NOT tenant-scoped in the same way. Access control is handled at the application level.
-- teams: Super Admin can see all; regular users see only their memberships (via team_members join)
-- users: Visible to admins and within team context
-- sessions: User-specific, not tenant-specific
-- platform_admins: Super Admin only (application-level enforcement)
-- audit_logs: Super Admin for all; Team users for their team only (application-level)
-- platform_settings: Super Admin only (application-level enforcement)

-- Grant permissions to the application role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO teamtrack_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO teamtrack_app;

-- Ensure future tables also grant permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO teamtrack_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO teamtrack_app;

COMMENT ON POLICY team_members_tenant_isolation ON team_members IS 'Enforces team-level data isolation. Super Admins can access all teams; regular users can only access their current team context.';

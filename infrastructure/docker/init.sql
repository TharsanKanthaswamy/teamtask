-- TeamTrack Database Initialization
-- This script creates the necessary database roles and sets up Row-Level Security

-- Create application role (used by the NestJS backend at runtime)
-- This role does NOT have BYPASSRLS privilege
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'teamtrack_app') THEN
        CREATE ROLE teamtrack_app WITH LOGIN PASSWORD 'app_password_change_in_production';
    END IF;
END
$$;

-- Grant necessary privileges to the application role
GRANT CONNECT ON DATABASE teamtrack TO teamtrack_app;
GRANT USAGE ON SCHEMA public TO teamtrack_app;

-- The migration role (owner) will create tables
-- After migrations, we'll grant table-level permissions to teamtrack_app

-- Create a function to set the current tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_team_id UUID, is_super_admin BOOLEAN DEFAULT FALSE)
RETURNS VOID AS $$
BEGIN
    -- Set transaction-local variables for RLS policies
    PERFORM set_config('app.current_team_id', tenant_team_id::TEXT, TRUE);
    PERFORM set_config('app.is_super_admin', is_super_admin::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current tenant context
CREATE OR REPLACE FUNCTION get_current_team_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_team_id', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a function to check if current user is super admin
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

COMMENT ON FUNCTION set_tenant_context IS 'Sets the current team context for Row-Level Security. Must be called at the start of each tenant-scoped transaction.';
COMMENT ON FUNCTION get_current_team_id IS 'Returns the current team ID from the transaction-local context.';
COMMENT ON FUNCTION is_super_admin IS 'Returns TRUE if the current context is operating as a Super Admin.';

-- Down migration: Remove RLS policies from refresh_tokens and audit_logs

BEGIN;

-- Drop policies
DROP POLICY IF EXISTS refresh_tokens_tenant_isolation ON refresh_tokens;
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;

-- Disable RLS
ALTER TABLE refresh_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

COMMIT;

-- Migration: Add RLS policies for refresh_tokens and audit_logs
-- Purpose: Enforce tenant isolation on security-sensitive tables

BEGIN;

-- Enable RLS on refresh_tokens and audit_logs
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Refresh tokens policy: Allow access only for the token's tenant
CREATE POLICY refresh_tokens_tenant_isolation ON refresh_tokens
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

-- Audit logs policy: Allow access only for the log's tenant
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

COMMIT;

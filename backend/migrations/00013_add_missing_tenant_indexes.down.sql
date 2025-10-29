-- Down Migration: Remove added tenant indexes

BEGIN;

DROP INDEX IF EXISTS idx_lead_comments_tenant_id;
DROP INDEX IF EXISTS idx_lead_activities_tenant_id;
DROP INDEX IF EXISTS idx_form_submissions_tenant_id;
DROP INDEX IF EXISTS idx_lead_comments_user_id;
DROP INDEX IF EXISTS idx_lead_activities_user_id;

COMMIT;

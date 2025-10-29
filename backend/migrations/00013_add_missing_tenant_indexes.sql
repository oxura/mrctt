-- Migration: Add missing tenant_id indexes
-- Purpose: Improve performance of tenant-scoped queries and RLS

BEGIN;

-- Add tenant_id indexes for tables that have tenant_id but no index
CREATE INDEX idx_lead_comments_tenant_id ON lead_comments(tenant_id);
CREATE INDEX idx_lead_activities_tenant_id ON lead_activities(tenant_id);
CREATE INDEX idx_form_submissions_tenant_id ON form_submissions(tenant_id);

-- Add user_id indexes for filtering by author
CREATE INDEX idx_lead_comments_user_id ON lead_comments(user_id);
CREATE INDEX idx_lead_activities_user_id ON lead_activities(user_id);

COMMIT;

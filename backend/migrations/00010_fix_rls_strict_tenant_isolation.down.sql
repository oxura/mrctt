-- Down Migration: Rollback strict RLS policies to permissive version
-- WARNING: This rollback reduces security! Use only in emergency.

BEGIN;

-- Drop strict policies
DROP POLICY IF EXISTS users_tenant_isolation ON users;
DROP POLICY IF EXISTS products_tenant_isolation ON products;
DROP POLICY IF EXISTS groups_tenant_isolation ON groups;
DROP POLICY IF EXISTS leads_tenant_isolation ON leads;
DROP POLICY IF EXISTS lead_comments_tenant_isolation ON lead_comments;
DROP POLICY IF EXISTS lead_activities_tenant_isolation ON lead_activities;
DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks;
DROP POLICY IF EXISTS forms_tenant_isolation ON forms;
DROP POLICY IF EXISTS form_submissions_tenant_isolation ON form_submissions;

-- Restore permissive policies from 00009 (with OR ... IS NULL fallback)
CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

CREATE POLICY products_tenant_isolation ON products
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

CREATE POLICY groups_tenant_isolation ON groups
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

CREATE POLICY leads_tenant_isolation ON leads
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

CREATE POLICY lead_comments_tenant_isolation ON lead_comments
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

CREATE POLICY lead_activities_tenant_isolation ON lead_activities
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

CREATE POLICY tasks_tenant_isolation ON tasks
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

CREATE POLICY forms_tenant_isolation ON forms
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

CREATE POLICY form_submissions_tenant_isolation ON form_submissions
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

COMMIT;

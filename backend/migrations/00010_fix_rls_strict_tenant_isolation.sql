-- Migration: Fix RLS policies to enforce strict tenant isolation
-- Remove the OR current_setting('app.tenant_id', true) IS NULL clause

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS users_tenant_isolation ON users;
DROP POLICY IF EXISTS products_tenant_isolation ON products;
DROP POLICY IF EXISTS groups_tenant_isolation ON groups;
DROP POLICY IF EXISTS leads_tenant_isolation ON leads;
DROP POLICY IF EXISTS lead_comments_tenant_isolation ON lead_comments;
DROP POLICY IF EXISTS lead_activities_tenant_isolation ON lead_activities;
DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks;
DROP POLICY IF EXISTS forms_tenant_isolation ON forms;
DROP POLICY IF EXISTS form_submissions_tenant_isolation ON form_submissions;

-- Recreate policies with strict tenant matching (no NULL bypass)
CREATE POLICY users_tenant_isolation ON users
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY products_tenant_isolation ON products
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY groups_tenant_isolation ON groups
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY leads_tenant_isolation ON leads
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY lead_comments_tenant_isolation ON lead_comments
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY lead_activities_tenant_isolation ON lead_activities
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY tasks_tenant_isolation ON tasks
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY forms_tenant_isolation ON forms
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

CREATE POLICY form_submissions_tenant_isolation ON form_submissions
  USING (
    current_setting('app.tenant_id', true) IS NOT NULL 
    AND tenant_id::text = current_setting('app.tenant_id', true)
  );

COMMIT;

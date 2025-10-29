-- Down Migration: Disable Row-Level Security (RLS) on tenant-scoped tables

BEGIN;

-- Drop policies
DROP POLICY IF EXISTS users_tenant_isolation ON users;
DROP POLICY IF EXISTS products_tenant_isolation ON products;
DROP POLICY IF EXISTS groups_tenant_isolation ON groups;
DROP POLICY IF EXISTS leads_tenant_isolation ON leads;
DROP POLICY IF EXISTS lead_comments_tenant_isolation ON lead_comments;
DROP POLICY IF EXISTS lead_activities_tenant_isolation ON lead_activities;
DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks;
DROP POLICY IF EXISTS forms_tenant_isolation ON forms;
DROP POLICY IF EXISTS form_submissions_tenant_isolation ON form_submissions;

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions DISABLE ROW LEVEL SECURITY;

COMMIT;

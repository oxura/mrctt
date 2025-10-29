-- Migration: Enable Row-Level Security (RLS) on tenant-scoped tables
-- Implements database-level tenant isolation

BEGIN;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies based on app.tenant_id session variable
-- Users table
CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

-- Products table
CREATE POLICY products_tenant_isolation ON products
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

-- Groups table
CREATE POLICY groups_tenant_isolation ON groups
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

-- Leads table
CREATE POLICY leads_tenant_isolation ON leads
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

-- Lead comments table
CREATE POLICY lead_comments_tenant_isolation ON lead_comments
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

-- Lead activities table
CREATE POLICY lead_activities_tenant_isolation ON lead_activities
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

-- Tasks table
CREATE POLICY tasks_tenant_isolation ON tasks
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

-- Forms table
CREATE POLICY forms_tenant_isolation ON forms
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

-- Form submissions table
CREATE POLICY form_submissions_tenant_isolation ON form_submissions
  USING (tenant_id::text = current_setting('app.tenant_id', true) OR current_setting('app.tenant_id', true) IS NULL);

COMMIT;

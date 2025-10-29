-- Drop composite indexes added for tasks queries

DROP INDEX IF EXISTS idx_tasks_tenant_assigned_completed_duedate;
DROP INDEX IF EXISTS idx_tasks_tenant_duedate;
DROP INDEX IF EXISTS idx_tasks_tenant_completed_duedate;

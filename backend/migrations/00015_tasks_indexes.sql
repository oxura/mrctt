-- Add composite indexes for tasks queries (Comment 15)
-- Optimizes tasks overdue and calendar queries

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_completed_duedate
ON tasks (tenant_id, is_completed, due_date)
WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_duedate
ON tasks (tenant_id, due_date)
WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_assigned_completed_duedate
ON tasks (tenant_id, assigned_to, is_completed, due_date)
WHERE assigned_to IS NOT NULL AND due_date IS NOT NULL;

-- Add comment
COMMENT ON INDEX idx_tasks_tenant_completed_duedate IS 'Optimizes overdue tasks queries';
COMMENT ON INDEX idx_tasks_tenant_duedate IS 'Optimizes calendar queries';
COMMENT ON INDEX idx_tasks_tenant_assigned_completed_duedate IS 'Optimizes user-specific task queries';

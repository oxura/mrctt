-- Migration: Grant manager role read access to all tasks
-- Created at 2024-01-10

BEGIN;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'tasks:read:all'
LEFT JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission_id = p.id
WHERE r.name = 'manager' AND rp.id IS NULL;

COMMIT;

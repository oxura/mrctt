BEGIN;

DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'manager')
  AND permission_id IN (
    SELECT id FROM permissions 
    WHERE name IN ('tasks:read:all', 'tasks:update:all', 'tasks:delete:all')
  );

COMMIT;

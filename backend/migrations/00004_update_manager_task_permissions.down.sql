BEGIN;

DELETE FROM role_permissions 
WHERE role_name = 'manager' 
  AND permission_name IN ('tasks:read:all', 'tasks:update:all', 'tasks:delete:all');

COMMIT;

import { Router } from 'express';
import {
  listTeamMembers,
  inviteTeamMember,
  getCurrentUserPermissions,
  listRoles,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission, requireAllPermissions } from '../middleware/rbac';

const router = Router();

router.get(
  '/me/permissions',
  authenticate,
  requirePermission('users:read:own'),
  getCurrentUserPermissions
);

router.get(
  '/team',
  authenticate,
  tenantGuard,
  requirePermission('users:read'),
  listTeamMembers
);

router.post(
  '/team',
  authenticate,
  tenantGuard,
  requireAllPermissions('users:create', 'users:manage-roles'),
  inviteTeamMember
);

router.get(
  '/roles',
  authenticate,
  requirePermission('users:read'),
  listRoles
);

export default router;

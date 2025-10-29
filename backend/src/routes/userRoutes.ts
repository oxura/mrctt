import { Router } from 'express';
import {
  listTeamMembers,
  sendTeamInvite,
  verifyInvite,
  acceptInvite,
  updateTeamMemberRole,
  removeTeamMember,
  cancelInvite,
  getCurrentUserPermissions,
  listRoles,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission, requireAllPermissions } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';

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
  '/team/invite',
  authenticate,
  tenantGuard,
  requireAllPermissions('users:create', 'users:manage-roles'),
  auditLog('user.invite', 'user'),
  sendTeamInvite
);

router.get('/team/invite/:token', verifyInvite);

router.post('/team/accept-invite', acceptInvite);

router.patch(
  '/team/:userId/role',
  authenticate,
  tenantGuard,
  requireAllPermissions('users:update', 'users:manage-roles'),
  auditLog('user.role_updated', 'user'),
  updateTeamMemberRole
);

router.delete(
  '/team/:userId',
  authenticate,
  tenantGuard,
  requireAllPermissions('users:delete', 'users:manage-roles'),
  auditLog('user.removed', 'user'),
  removeTeamMember
);

router.delete(
  '/team/invite/:inviteId',
  authenticate,
  tenantGuard,
  requirePermission('users:create'),
  cancelInvite
);

router.get(
  '/roles',
  authenticate,
  requirePermission('users:read'),
  listRoles
);

export default router;

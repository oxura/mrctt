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
import { dbSession } from '../middleware/dbSession';

const router = Router();

router.get('/team/invite/:token', verifyInvite);
router.post('/team/accept-invite', acceptInvite);

router.use(authenticate, tenantGuard, dbSession);

router.get('/me/permissions', requirePermission('users:read:own'), getCurrentUserPermissions);

router.get('/team', requirePermission('users:read'), listTeamMembers);

router.post(
  '/team/invite',
  requireAllPermissions('users:create', 'users:manage-roles'),
  auditLog('user.invite', 'user'),
  sendTeamInvite
);

router.patch(
  '/team/:userId/role',
  requireAllPermissions('users:update', 'users:manage-roles'),
  auditLog('user.role_updated', 'user'),
  updateTeamMemberRole
);

router.delete(
  '/team/:userId',
  requireAllPermissions('users:delete', 'users:manage-roles'),
  auditLog('user.removed', 'user'),
  removeTeamMember
);

router.delete(
  '/team/invite/:inviteId',
  requirePermission('users:create'),
  cancelInvite
);

router.get('/roles', requirePermission('users:read'), listRoles);

export default router;

import { Router } from 'express';
import groupsController from '../controllers/groupsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate, tenantGuard);

router.get('/', requirePermission('groups:read'), groupsController.list);
router.post('/', requirePermission('groups:create'), auditLog('group.create', 'group'), groupsController.create);
router.get('/:id', requirePermission('groups:read'), groupsController.getOne);
router.put('/:id', requirePermission('groups:update'), auditLog('group.update', 'group'), groupsController.update);
router.delete('/:id', requirePermission('groups:delete'), auditLog('group.delete', 'group'), groupsController.delete);

export default router;

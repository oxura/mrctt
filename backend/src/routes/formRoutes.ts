import { Router } from 'express';
import formsController from '../controllers/formsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requireModule } from '../middleware/moduleGuard';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';

const router = Router();

router.get('/public/:publicUrl', formsController.getPublic);
router.post('/public/:publicUrl/submit', formsController.submitPublic);

router.use(authenticate, tenantGuard, requireModule('forms'));

router.get('/', requirePermission('forms:read'), formsController.list);
router.post('/', requirePermission('forms:create'), auditLog('form.create', 'form'), formsController.create);
router.get('/:id', requirePermission('forms:read'), formsController.getOne);
router.put('/:id', requirePermission('forms:update'), auditLog('form.update', 'form'), formsController.update);
router.delete('/:id', requirePermission('forms:delete'), auditLog('form.delete', 'form'), formsController.delete);
router.post('/:id/regenerate-url', requirePermission('forms:update'), auditLog('form.regenerate_url', 'form'), formsController.regeneratePublicUrl);

export default router;

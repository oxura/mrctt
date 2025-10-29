import { Router } from 'express';
import productsController from '../controllers/productsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate, tenantGuard);

router.get('/', requirePermission('products:read'), productsController.list);
router.post('/', requirePermission('products:create'), auditLog('product.create', 'product'), productsController.create);
router.get('/:id', requirePermission('products:read'), productsController.getOne);
router.put('/:id', requirePermission('products:update'), auditLog('product.update', 'product'), productsController.update);
router.patch('/:id/status', requirePermission('products:update'), auditLog('product.status_change', 'product'), productsController.updateStatus);
router.delete('/:id', requirePermission('products:delete'), auditLog('product.delete', 'product'), productsController.delete);

export default router;

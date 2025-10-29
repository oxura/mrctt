import { Router } from 'express';
import productsController from '../controllers/productsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { requireModule } from '../middleware/moduleGuard';
import {
  productsRateLimiter,
  productsMutationsLimiter,
  productDeleteLimiter,
} from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate, tenantGuard, requireModule('products'));

router.get('/', productsRateLimiter, requirePermission('products:read'), productsController.list);
router.post(
  '/',
  productsMutationsLimiter,
  requirePermission('products:create'),
  auditLog('product.create', 'product'),
  productsController.create
);
router.get('/:id', productsRateLimiter, requirePermission('products:read'), productsController.getOne);
router.put(
  '/:id',
  productsMutationsLimiter,
  requirePermission('products:update'),
  auditLog('product.update', 'product'),
  productsController.update
);
router.patch(
  '/:id/status',
  productsMutationsLimiter,
  requirePermission('products:update'),
  auditLog('product.status_change', 'product'),
  productsController.updateStatus
);
router.delete(
  '/:id',
  productDeleteLimiter,
  requirePermission('products:delete'),
  auditLog('product.delete', 'product'),
  productsController.delete
);

router.patch(
  '/batch/status',
  productsMutationsLimiter,
  requirePermission('products:update'),
  auditLog('product.batch_status', 'product'),
  productsController.batchUpdateStatus
);

export default router;

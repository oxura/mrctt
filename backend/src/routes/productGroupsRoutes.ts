import { Router, Request, Response, NextFunction } from 'express';
import groupsController from '../controllers/groupsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { requireModule } from '../middleware/moduleGuard';
import { dbSession } from '../middleware/dbSession';
import { AppError } from '../utils/appError';
import {
  groupsRateLimiter,
  groupsMutationsLimiter,
  groupDeleteLimiter,
} from '../middleware/rateLimiter';

// Router for nested product groups: /products/:productId/groups
export const productGroupsForProductRouter = Router({ mergeParams: true });

productGroupsForProductRouter.use(authenticate, tenantGuard, dbSession, requireModule('products'));

productGroupsForProductRouter.use((req: Request, _res: Response, next: NextFunction) => {
  const { productId } = req.params as { productId?: string };

  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  (req.query as Record<string, unknown>).product_id = productId;

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.body = {
      ...(req.body ?? {}),
      product_id: productId,
    };
  }

  next();
});

productGroupsForProductRouter.get('/', groupsRateLimiter, requirePermission('groups:read'), groupsController.list);
productGroupsForProductRouter.post(
  '/',
  groupsMutationsLimiter,
  requirePermission('groups:create'),
  auditLog('group.create', 'group'),
  groupsController.create
);

// Router for single group operations: /product-groups/:id
export const productGroupRouter = Router();

productGroupRouter.use(authenticate, tenantGuard, dbSession, requireModule('products'));

productGroupRouter.get('/:id', groupsRateLimiter, requirePermission('groups:read'), groupsController.getOne);
productGroupRouter.put(
  '/:id',
  groupsMutationsLimiter,
  requirePermission('groups:update'),
  auditLog('group.update', 'group'),
  groupsController.update
);
productGroupRouter.delete(
  '/:id',
  groupDeleteLimiter,
  requirePermission('groups:delete'),
  auditLog('group.delete', 'group'),
  groupsController.delete
);

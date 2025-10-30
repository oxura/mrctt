import { Router, Request, Response, NextFunction } from 'express';
import groupsController from '../controllers/groupsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { AppError } from '../utils/appError';
import {
  groupsRateLimiter,
  groupsMutationsLimiter,
  groupDeleteLimiter,
} from '../middleware/rateLimiter';
import { dbSession } from '../middleware/dbSession';

// Router for nested product groups: /products/:productId/groups
export const productGroupsForProductRouter = Router({ mergeParams: true });

productGroupsForProductRouter.use(authenticate, tenantGuard, dbSession);

productGroupsForProductRouter.use((req: Request, _res: Response, next: NextFunction) => {
  if (!req.params.productId) {
    throw new AppError('Product ID is required', 400);
  }

  req.query.product_id = req.params.productId;

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.body = {
      ...req.body,
      product_id: req.params.productId,
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

productGroupRouter.use(authenticate, tenantGuard, dbSession);

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

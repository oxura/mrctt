import { Router } from 'express';
import groupsController from '../controllers/groupsController';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { AppError } from '../utils/appError';
import {
  groupsRateLimiter,
  groupsMutationsLimiter,
  groupDeleteLimiter,
} from '../middleware/rateLimiter';

// Router for nested product groups: /products/:productId/groups
export const productGroupsForProductRouter = Router({ mergeParams: true });

productGroupsForProductRouter.use((req, _res, next) => {
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

import { Router } from 'express';
import tasksController from '../controllers/tasksController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import {
  requireAnyPermission,
  requirePermission,
  requirePermissionWithOwnership,
} from '../middleware/rbac';
import { requireModule } from '../middleware/moduleGuard';
import { auditLog } from '../middleware/audit';
import tasksRepository from '../repositories/tasksRepository';
import { tasksMutationsLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate, tenantGuard, requireModule('tasks'));

router.get(
  '/',
  requireAnyPermission('tasks:read:all', 'tasks:read:own'),
  tasksController.listAll
);

router.get(
  '/calendar',
  requireAnyPermission('tasks:read:all', 'tasks:read:own'),
  tasksController.calendar
);

router.get(
  '/overdue',
  requireAnyPermission('tasks:read:all', 'tasks:read:own'),
  tasksController.overdue
);

router.post(
  '/',
  tasksMutationsLimiter,
  requirePermission('tasks:create'),
  auditLog('task.create', 'task'),
  tasksController.createStandalone
);

router.patch(
  '/:taskId',
  tasksMutationsLimiter,
  requirePermissionWithOwnership(
    'tasks:update:all',
    'tasks:update:own',
    async (req) => {
      return await tasksRepository.getOwnerIdIfExists(req.tenantId!, req.params.taskId);
    }
  ),
  auditLog('task.update', 'task'),
  tasksController.update
);

router.delete(
  '/:taskId',
  tasksMutationsLimiter,
  requirePermissionWithOwnership(
    'tasks:delete:all',
    'tasks:delete:own',
    async (req) => {
      return await tasksRepository.getOwnerIdIfExists(req.tenantId!, req.params.taskId);
    }
  ),
  auditLog('task.delete', 'task'),
  tasksController.delete
);

export default router;

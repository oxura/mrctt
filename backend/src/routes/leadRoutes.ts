import { Router } from 'express';
import leadsController from '../controllers/leadsController';
import commentsController from '../controllers/commentsController';
import activitiesController from '../controllers/activitiesController';
import tasksController from '../controllers/tasksController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import {
  requireAnyPermission,
  requirePermission,
  requirePermissionWithOwnership,
} from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import {
  leadsRateLimiter,
  leadMutationLimiter,
  leadCommentLimiter,
  leadTaskLimiter,
  leadDeleteLimiter,
  leadsMutationsLimiter,
  commentsLimiter,
  tasksMutationsLimiter,
} from '../middleware/rateLimiter';
import leadsRepository from '../repositories/leadsRepository';
import tasksRepository from '../repositories/tasksRepository';

const router = Router();

router.use(authenticate, tenantGuard);

router.get(
  '/',
  leadsRateLimiter,
  requireAnyPermission('leads:read:all', 'leads:read:own'),
  leadsController.list
);

router.post(
  '/',
  leadsMutationsLimiter,
  leadMutationLimiter,
  requirePermission('leads:create'),
  auditLog('lead.create', 'lead'),
  leadsController.create
);

router.get(
  '/:id',
  requirePermissionWithOwnership(
    'leads:read:all',
    'leads:read:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.id);
    }
  ),
  leadsController.getOne
);

router.patch(
  '/:id',
  leadsMutationsLimiter,
  leadMutationLimiter,
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.id);
    }
  ),
  auditLog('lead.update', 'lead'),
  leadsController.update
);

router.patch(
  '/:id/status',
  leadsMutationsLimiter,
  leadMutationLimiter,
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.id);
    }
  ),
  auditLog('lead.status_change', 'lead'),
  leadsController.updateStatus
);

router.delete(
  '/:id',
  leadsMutationsLimiter,
  leadDeleteLimiter,
  requirePermissionWithOwnership(
    'leads:delete:all',
    'leads:delete:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.id);
    }
  ),
  auditLog('lead.delete', 'lead'),
  leadsController.delete
);

router.get(
  '/:leadId/comments',
  requirePermissionWithOwnership(
    'leads:read:all',
    'leads:read:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.leadId);
    }
  ),
  commentsController.list
);

router.post(
  '/:leadId/comments',
  commentsLimiter,
  leadCommentLimiter,
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.leadId);
    }
  ),
  auditLog('comment.create', 'lead'),
  commentsController.create
);

router.get(
  '/:leadId/activities',
  requirePermissionWithOwnership(
    'leads:read:all',
    'leads:read:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.leadId);
    }
  ),
  activitiesController.list
);

router.get(
  '/:leadId/tasks',
  requirePermissionWithOwnership(
    'leads:read:all',
    'leads:read:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.leadId);
    }
  ),
  tasksController.list
);

router.post(
  '/:leadId/tasks',
  tasksMutationsLimiter,
  leadTaskLimiter,
  requirePermission('tasks:create'),
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => {
      return await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.leadId);
    }
  ),
  auditLog('task.create', 'lead'),
  tasksController.create
);

router.patch(
  '/:leadId/tasks/:taskId',
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
  '/:leadId/tasks/:taskId',
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

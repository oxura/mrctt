import { Router } from 'express';
import leadsController from '../controllers/leadsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import {
  requireAnyPermission,
  requirePermission,
  requirePermissionWithOwnership,
} from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { leadsRateLimiter } from '../middleware/rateLimiter';
import leadsRepository from '../repositories/leadsRepository';

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
      const lead = await leadsRepository.findById(req.tenantId!, req.params.id);
      return lead.assigned_to;
    }
  ),
  leadsController.getOne
);

router.patch(
  '/:id',
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => {
      const lead = await leadsRepository.findById(req.tenantId!, req.params.id);
      return lead.assigned_to;
    }
  ),
  auditLog('lead.update', 'lead'),
  leadsController.update
);

router.patch(
  '/:id/status',
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => {
      const lead = await leadsRepository.findById(req.tenantId!, req.params.id);
      return lead.assigned_to;
    }
  ),
  auditLog('lead.status_change', 'lead'),
  leadsController.updateStatus
);

router.delete(
  '/:id',
  requirePermissionWithOwnership(
    'leads:delete:all',
    'leads:delete:own',
    async (req) => {
      const lead = await leadsRepository.findById(req.tenantId!, req.params.id);
      return lead.assigned_to;
    }
  ),
  auditLog('lead.delete', 'lead'),
  leadsController.delete
);

export default router;

import { Router } from 'express';
import formsController from '../controllers/formsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requireModule } from '../middleware/moduleGuard';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { dbSession } from '../middleware/dbSession';
import {
  publicFormGetLimiter,
  publicFormSubmissionLimiter,
  createTenantUserLimiter,
} from '../middleware/rateLimiter';

const router = Router();

router.get('/public/:publicUrl', publicFormGetLimiter, formsController.getPublic);
router.post('/public/:publicUrl/submit', publicFormSubmissionLimiter, formsController.submitPublic);

router.use(authenticate, tenantGuard, dbSession, requireModule('forms'));

router.get('/', requirePermission('forms:read'), formsController.list);
router.post(
  '/',
  createTenantUserLimiter('forms-create', 30),
  requirePermission('forms:create'),
  auditLog('form.create', 'form'),
  formsController.create
);
router.get('/:id', requirePermission('forms:read'), formsController.getOne);
router.put(
  '/:id',
  createTenantUserLimiter('forms-update', 50),
  requirePermission('forms:update'),
  auditLog('form.update', 'form'),
  formsController.update
);
router.delete(
  '/:id',
  createTenantUserLimiter('forms-delete', 20),
  requirePermission('forms:delete'),
  auditLog('form.delete', 'form'),
  formsController.delete
);
router.post(
  '/:id/regenerate-url',
  createTenantUserLimiter('forms-regenerate-url', 10),
  requirePermission('forms:update'),
  auditLog('form.regenerate_url', 'form'),
  formsController.regeneratePublicUrl
);

export default router;

import { Router } from 'express';
import {
  getCurrentTenant,
  listTenants,
  updateCurrentTenantOnboarding,
} from '../controllers/tenantController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.get('/current', authenticate, tenantGuard, requirePermission('tenants:read'), getCurrentTenant);
router.patch(
  '/current/onboarding',
  authenticate,
  tenantGuard,
  requirePermission('tenants:update'),
  updateCurrentTenantOnboarding
);
router.get('/', authenticate, requirePermission('tenants:list'), listTenants);

export default router;

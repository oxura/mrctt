import { Router } from 'express';
import {
  getCurrentTenant,
  listTenants,
  updateCurrentTenantOnboarding,
  updateCurrentTenantSettings,
} from '../controllers/tenantController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';

const router = Router();

router.get('/current', authenticate, tenantGuard, requirePermission('tenants:read'), getCurrentTenant);
router.patch(
  '/current/onboarding',
  authenticate,
  tenantGuard,
  requirePermission('tenants:update'),
  auditLog('tenant.onboarding.update', 'tenant'),
  updateCurrentTenantOnboarding
);
router.put(
  '/current/settings',
  authenticate,
  tenantGuard,
  requirePermission('tenants:update'),
  auditLog('tenant.settings.update', 'tenant'),
  updateCurrentTenantSettings
);
router.get('/', authenticate, requirePermission('tenants:list'), listTenants);

export default router;

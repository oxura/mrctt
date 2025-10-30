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
import { dbSession } from '../middleware/dbSession';

const router = Router();

router.use(authenticate, tenantGuard, dbSession);

router.get('/current', requirePermission('tenants:read'), getCurrentTenant);
router.patch(
  '/current/onboarding',
  requirePermission('tenants:update'),
  auditLog('tenant.onboarding.update', 'tenant'),
  updateCurrentTenantOnboarding
);
router.put(
  '/current/settings',
  requirePermission('tenants:update'),
  auditLog('tenant.settings.update', 'tenant'),
  updateCurrentTenantSettings
);
router.get('/', requirePermission('tenants:list'), listTenants);

export default router;

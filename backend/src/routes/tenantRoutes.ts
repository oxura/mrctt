import { Router } from 'express';
import { getCurrentTenant, listTenants } from '../controllers/tenantController';
import { authenticate, requireRole } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';

const router = Router();

router.get('/current', authenticate, tenantGuard, getCurrentTenant);
router.get('/', authenticate, requireRole('platform_owner'), listTenants);

export default router;

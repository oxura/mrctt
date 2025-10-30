import { Router } from 'express';
import searchController from '../controllers/searchController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { createTenantUserLimiter } from '../middleware/rateLimiter';
import { dbSession } from '../middleware/dbSession';

const router = Router();

const searchRateLimiter = createTenantUserLimiter('search', 30);

router.use(authenticate, tenantGuard, dbSession);

router.get('/', searchRateLimiter, searchController.search);

export default router;

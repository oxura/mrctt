import { Router } from 'express';
import { listAuditLogs } from '../controllers/auditController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { dbSession } from '../middleware/dbSession';

const router = Router();

router.get(
  '/',
  authenticate,
  tenantGuard,
  dbSession,
  requirePermission('audit:read'),
  listAuditLogs
);

export default router;

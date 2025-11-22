import { Router } from 'express';
import { processAICommand } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';

const router = Router();

router.post(
  '/command',
  authenticate,
  tenantGuard,
  processAICommand
);

export default router;

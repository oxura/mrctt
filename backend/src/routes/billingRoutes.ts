import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import {
  getBillingOverview,
  changePlan,
  renewSubscription,
  createManualPayment,
} from '../controllers/billingController';

const router = Router();

router.use(authenticate);
router.use(tenantGuard);

router.get('/', getBillingOverview);
router.post('/change-plan', changePlan);
router.post('/renew', renewSubscription);
router.post('/payments', createManualPayment);

export default router;

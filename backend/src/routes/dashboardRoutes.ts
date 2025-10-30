import { Router } from 'express';
import dashboardController from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { dbSession } from '../middleware/dbSession';

const router = Router();

router.use(authenticate, tenantGuard, dbSession);

router.get(
  '/stats',
  requirePermission('dashboard:view'),
  dashboardController.getStats.bind(dashboardController)
);
router.get(
  '/leads-chart',
  requirePermission('dashboard:view'),
  dashboardController.getLeadsChart.bind(dashboardController)
);
router.get(
  '/activity',
  requirePermission('dashboard:view'),
  dashboardController.getActivityFeed.bind(dashboardController)
);
router.get(
  '/tasks',
  requirePermission('dashboard:view'),
  dashboardController.getMyTasks.bind(dashboardController)
);
router.patch(
  '/tasks/:taskId',
  requirePermission('dashboard:view'),
  dashboardController.updateTaskCompletion.bind(dashboardController)
);

export default router;

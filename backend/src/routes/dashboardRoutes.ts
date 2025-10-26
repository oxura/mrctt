import { Router } from 'express';
import dashboardController from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';

const router = Router();

router.use(authenticate, tenantGuard);

router.get('/stats', dashboardController.getStats.bind(dashboardController));
router.get('/leads-chart', dashboardController.getLeadsChart.bind(dashboardController));
router.get('/activity', dashboardController.getActivityFeed.bind(dashboardController));
router.get('/tasks', dashboardController.getMyTasks.bind(dashboardController));
router.patch('/tasks/:taskId', dashboardController.updateTaskCompletion.bind(dashboardController));

export default router;

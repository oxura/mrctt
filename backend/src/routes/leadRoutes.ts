import { Router } from 'express';
import leadsController from '../controllers/leadsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', leadsController.list);
router.post('/', requireRole(['owner', 'admin', 'manager']), leadsController.create);
router.get('/:id', leadsController.getOne);
router.patch('/:id', requireRole(['owner', 'admin', 'manager']), leadsController.update);
router.patch('/:id/status', requireRole(['owner', 'admin', 'manager']), leadsController.updateStatus);
router.delete('/:id', requireRole(['owner', 'admin']), leadsController.delete);

export default router;

import { Router } from 'express';
import productsController from '../controllers/productsController';
import { requireAuth } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(requireAuth, requireTenant);

router.get('/', productsController.list);
router.post('/', productsController.create);
router.get('/:id', productsController.getOne);
router.put('/:id', productsController.update);
router.patch('/:id/status', productsController.updateStatus);
router.delete('/:id', productsController.delete);

export default router;

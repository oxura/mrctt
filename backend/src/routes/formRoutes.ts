import { Router } from 'express';
import formsController from '../controllers/formsController';
import { authenticate } from '../middleware/auth';
import { tenantGuard } from '../middleware/tenant';

const router = Router();

router.get('/public/:publicUrl', formsController.getPublic);
router.post('/public/:publicUrl/submit', formsController.submitPublic);

router.use(authenticate, tenantGuard);

router.get('/', formsController.list);
router.post('/', formsController.create);
router.get('/:id', formsController.getOne);
router.put('/:id', formsController.update);
router.delete('/:id', formsController.delete);
router.post('/:id/regenerate-url', formsController.regeneratePublicUrl);

export default router;

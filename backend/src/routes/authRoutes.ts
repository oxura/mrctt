import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/password/forgot', requestPasswordReset);
router.post('/password/reset', resetPassword);
router.get('/me', authenticate, getCurrentUser);

export default router;

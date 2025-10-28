import { Router } from 'express';
import { register, login, getCurrentUser, refresh, logout } from '../controllers/authController';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController';
import { authenticate } from '../middleware/auth';
import {
  authLoginLimiter,
  authPasswordResetLimiter,
  authRegisterLimiter,
  authRefreshLimiter,
} from '../middleware/rateLimiter';
import { csrfProtection } from '../middleware/csrf';

const router = Router();

router.post('/register', authRegisterLimiter, register);
router.post('/login', authLoginLimiter, login);
router.post('/password/forgot', authPasswordResetLimiter, requestPasswordReset);
router.post('/password/reset', authPasswordResetLimiter, resetPassword);

router.use(csrfProtection);

router.post('/refresh', authRefreshLimiter, authenticate, refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;

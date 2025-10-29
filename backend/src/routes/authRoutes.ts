import { Router } from 'express';
import { register, login, getCurrentUser, refreshSession, logout } from '../controllers/authController';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController';
import { authenticate } from '../middleware/auth';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  authRefreshLimiter,
} from '../middleware/rateLimiter';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/password/forgot', forgotPasswordLimiter, requestPasswordReset);
router.post('/password/reset', resetPasswordLimiter, resetPassword);

router.post('/refresh', authRefreshLimiter, refreshSession);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;

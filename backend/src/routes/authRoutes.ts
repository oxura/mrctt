import { Router } from 'express';
import { register, login, getCurrentUser, refreshSession, logout } from '../controllers/authController';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController';
import { authenticate } from '../middleware/auth';
import {
  loginLimiter,
  loginSuccessLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  refreshLimiter,
} from '../middleware/rateLimiter';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, loginSuccessLimiter, login);
router.post('/password/forgot', forgotPasswordLimiter, requestPasswordReset);
router.post('/password/reset', resetPasswordLimiter, resetPassword);

router.post('/refresh', refreshLimiter, refreshSession);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;

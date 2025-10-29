import { Router } from 'express';
import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import userRoutes from './userRoutes';
import auditRoutes from './auditRoutes';
import dashboardRoutes from './dashboardRoutes';
import leadRoutes from './leadRoutes';
import taskRoutes from './taskRoutes';
import productRoutes from './productRoutes';
import { generateCSRFToken } from '../utils/tokens';
import { env } from '../config/env';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/leads', leadRoutes);
router.use('/tasks', taskRoutes);
router.use('/products', productRoutes);

router.get('/health', (req, res) => {
  if (!req.cookies?.csrf_token) {
    const csrfToken = generateCSRFToken();
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      domain: env.COOKIE_DOMAIN ?? undefined,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

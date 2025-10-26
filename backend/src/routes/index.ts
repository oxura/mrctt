import { Router } from 'express';
import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import userRoutes from './userRoutes';
import auditRoutes from './auditRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

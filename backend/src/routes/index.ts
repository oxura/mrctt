import { Router } from 'express';
import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import userRoutes from './userRoutes';
import auditRoutes from './auditRoutes';
import dashboardRoutes from './dashboardRoutes';
import leadRoutes from './leadRoutes';
import taskRoutes from './taskRoutes';
import productRoutes from './productRoutes';
import groupRoutes from './groupRoutes';
import healthRoutes from './healthRoutes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/leads', leadRoutes);
router.use('/tasks', taskRoutes);
router.use('/products', productRoutes);
router.use('/groups', groupRoutes);

export default router;

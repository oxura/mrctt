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
import formRoutes from './formRoutes';
import healthRoutes from './healthRoutes';
import searchRoutes from './searchRoutes';
import { productGroupsForProductRouter, productGroupRouter } from './productGroupsRoutes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/forms', formRoutes);
router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/leads', leadRoutes);
router.use('/tasks', taskRoutes);
router.use('/products', productRoutes);
router.use('/products/:productId/groups', productGroupsForProductRouter);
router.use('/product-groups', productGroupRouter);
router.use('/groups', groupRoutes);
router.use('/search', searchRoutes);

export default router;

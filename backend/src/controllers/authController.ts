import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { AuditService } from '../services/auditService';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';

const authService = new AuthService();
const auditService = new AuditService();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  companyName: z.string().min(1),
  companySlug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  country: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  tenantSlug: z.string(),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const result = await authService.register(parsed.data);

  auditService
    .record({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: 'user.register',
      resourceType: 'user',
      resourceId: result.user.id,
      details: {
        email: result.user.email,
        tenantName: result.tenant.name,
        role: result.user.role,
      },
      request: req,
    })
    .catch((error) => {
      logger.warn('Failed to audit registration', { error });
    });

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const result = await authService.login(parsed.data);

  auditService
    .record({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: 'user.login',
      resourceType: 'user',
      resourceId: result.user.id,
      details: {
        email: result.user.email,
        tenantSlug: result.tenant.slug,
      },
      request: req,
    })
    .catch((error) => {
      logger.warn('Failed to audit login', { error });
    });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

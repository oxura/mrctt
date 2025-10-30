import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { AuditService } from '../services/auditService';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { generateCSRFToken } from '../utils/tokens';
import { env } from '../config/env';
import { decodeToken } from '../utils/jwt';

const authService = new AuthService();
const auditService = new AuditService();

const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1),
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

  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
  const result = await authService.login(parsed.data, ipAddress);

  const isProduction = env.NODE_ENV === 'production';
  const baseSecureCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN ?? undefined,
  };

  res.cookie('access_token', result.token, {
    ...baseSecureCookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refresh_token', result.refreshToken, {
    ...baseSecureCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('tenant_id', result.tenant.id, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN ?? undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const csrfToken = generateCSRFToken();
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN ?? undefined,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.setHeader('X-CSRF-Token', csrfToken);

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

  const { token: _, refreshToken: __, ...dataWithoutTokens } = result;

  res.status(200).json({
    status: 'success',
    data: { ...dataWithoutTokens, csrfToken },
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

export const refreshSession = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;
  const tenantId = req.cookies?.tenant_id;

  if (!refreshToken) {
    throw new AppError('Refresh token not found', 401);
  }

  if (!tenantId) {
    throw new AppError('Tenant context missing', 401);
  }

  let userId = req.user?.id;
  if (!userId) {
    const accessToken = req.cookies?.access_token;
    if (accessToken) {
      try {
        const decoded = decodeToken(accessToken);
        userId = decoded?.userId;
      } catch (error) {
        logger.debug('Failed to decode access token during refresh');
      }
    }
  }

  if (!userId) {
    throw new AppError('User context missing', 401);
  }

  const result = await authService.refreshAccessToken(refreshToken, userId, tenantId);

  const isProduction = env.NODE_ENV === 'production';
  const baseSecureCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN ?? undefined,
  };

  res.cookie('access_token', result.token, {
    ...baseSecureCookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refresh_token', result.refreshToken, {
    ...baseSecureCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const csrfToken = generateCSRFToken();
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN ?? undefined,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.setHeader('X-CSRF-Token', csrfToken);

  const { token: _, refreshToken: __, ...dataWithoutTokens } = result;

  res.status(200).json({
    status: 'success',
    data: { ...dataWithoutTokens, csrfToken },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    const tenantId = req.user.tenant_id || req.cookies?.tenant_id;
    await authService.logout(req.user.id, tenantId);
  }

  const isProduction = env.NODE_ENV === 'production';
  const baseSecureCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN ?? undefined,
  };

  res.clearCookie('access_token', baseSecureCookieOptions);
  res.clearCookie('refresh_token', baseSecureCookieOptions);
  res.clearCookie('tenant_id', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN ?? undefined,
  });
  res.clearCookie('csrf_token', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    domain: env.COOKIE_DOMAIN ?? undefined,
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

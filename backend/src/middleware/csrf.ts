import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { verifyCSRFToken } from '../utils/tokens';

const CSRF_EXEMPT_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/password/forgot',
  '/api/v1/auth/password/reset',
  '/api/v1/health',
]);

const CSRF_EXEMPT_PATTERNS = [
  /^\/api\/v1\/public\/forms\/.+$/,
];

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  if (CSRF_EXEMPT_PATHS.has(req.path) || CSRF_EXEMPT_PATTERNS.some((pattern) => pattern.test(req.path))) {
    return next();
  }

  const csrfTokenFromCookie = req.cookies?.csrf_token;
  const csrfTokenFromHeader = req.headers['x-csrf-token'] as string;

  if (!csrfTokenFromCookie || !csrfTokenFromHeader) {
    throw new AppError('CSRF token missing', 403);
  }

  if (!verifyCSRFToken(csrfTokenFromCookie, csrfTokenFromHeader)) {
    throw new AppError('Invalid CSRF token', 403);
  }

  next();
};

import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    const tenantSlug = req.body?.tenantSlug || '';
    const ip = req.ip || 'unknown';
    return `login-fail:${ip}:${email}:${tenantSlug}`;
  },
  message: 'Too many failed login attempts. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many failed login attempts. Please try again in a minute.',
    });
  },
});

export const loginSuccessLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    return `login-success:${ip}`;
  },
  message: 'Too many successful login attempts from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many successful login attempts from this IP. Please try again later.',
    });
  },
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    const tenantSlug = req.body?.tenantSlug || '';
    const ip = req.ip || 'unknown';
    return `forgot-password:${ip}:${email}:${tenantSlug}`;
  },
  message: 'Too many password reset requests. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many password reset requests. Please try again in a minute.',
    });
  },
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    const token = req.body?.token?.substring(0, 10) || 'unknown';
    return `reset-password:${ip}:${token}`;
  },
  message: 'Too many password reset attempts. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many password reset attempts. Please try again in a minute.',
    });
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    return `register:${ip}`;
  },
  message: 'Too many registration attempts. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many registration attempts. Please try again in a minute.',
    });
  },
});

const createTenantUserLimiter = (prefix: string, limit: number, windowMs = 60 * 1000) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator: (req) => {
      const tenantId = req.tenantId || 'unknown';
      const userId = req.user?.id || req.ip || 'anonymous';
      return `${prefix}:${tenantId}:${userId}`;
    },
    message: 'Too many requests from this tenant/user, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

export const leadsRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (req) => {
    const tenantId = req.tenantId || 'unknown';
    const userId = req.user?.id || 'anonymous';
    const ip = req.ip || 'unknown';
    return `${ip}:${tenantId}:${userId}`;
  },
  message: 'Too many requests from this tenant/user, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const leadMutationLimiter = createTenantUserLimiter('lead-mutation', 30);
export const leadCommentLimiter = createTenantUserLimiter('lead-comment', 30);
export const leadTaskLimiter = createTenantUserLimiter('lead-task', 30);
export const leadDeleteLimiter = createTenantUserLimiter('lead-delete', 20);
export const authRefreshLimiter = createTenantUserLimiter('auth-refresh', 20);

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
});

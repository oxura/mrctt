import rateLimit from 'express-rate-limit';

export const authLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    const tenantSlug = req.body?.tenantSlug || '';
    const ip = req.ip || 'unknown';
    return `login:${ip}:${email}:${tenantSlug}`;
  },
  message: 'Too many login attempts. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authPasswordResetLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    const tenantSlug = req.body?.tenantSlug || '';
    const ip = req.ip || 'unknown';
    return `password-reset:${ip}:${email}:${tenantSlug}`;
  },
  message: 'Too many password reset requests. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    return `register:${ip}`;
  },
  message: 'Too many registration attempts. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
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

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const resolveTenantScope = (req: Request): string => {
  const tenantHeader = req.headers['x-tenant-id'];
  const tenantFromHeader = Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader;
  return (
    req.tenantId ||
    req.cookies?.tenant_id ||
    (typeof tenantFromHeader === 'string' ? tenantFromHeader : null) ||
    'unknown'
  );
};

const resolveUserScope = (req: Request): string => {
  const cookieUserId = req.cookies?.user_id;
  return req.user?.id || (typeof cookieUserId === 'string' ? cookieUserId : null) || req.ip || 'anonymous';
};

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
      const tenantId = resolveTenantScope(req);
      const userId = resolveUserScope(req);
      return `${prefix}:${tenantId}:${userId}`;
    },
    message: 'Too many requests from this tenant/user, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many requests from this tenant/user, please try again later.',
        requestId: req.requestId,
      });
    },
  });

export const leadsRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (req) => {
    const tenantId = resolveTenantScope(req);
    const userId = resolveUserScope(req);
    return `leads-read:${tenantId}:${userId}`;
  },
  message: 'Too many requests from this tenant/user, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this tenant/user, please try again later.',
      requestId: req.requestId,
    });
  },
});

export const leadMutationLimiter = createTenantUserLimiter('lead-mutation', 30);
export const leadCommentLimiter = createTenantUserLimiter('lead-comment', 30);
export const leadTaskLimiter = createTenantUserLimiter('lead-task', 30);
export const leadDeleteLimiter = createTenantUserLimiter('lead-delete', 20);
export const refreshLimiter = createTenantUserLimiter('auth-refresh', 20);

export const leadsMutationsLimiter = createTenantUserLimiter('leads-mutations', 50);
export const commentsLimiter = createTenantUserLimiter('comments', 30);
export const tasksMutationsLimiter = createTenantUserLimiter('tasks-mutations', 40);

export const productsRateLimiter = createTenantUserLimiter('products-read', 100);
export const productsMutationsLimiter = createTenantUserLimiter('products-mutations', 50);
export const productDeleteLimiter = createTenantUserLimiter('product-delete', 20);

export const groupsRateLimiter = createTenantUserLimiter('groups-read', 100);
export const groupsMutationsLimiter = createTenantUserLimiter('groups-mutations', 50);
export const groupDeleteLimiter = createTenantUserLimiter('group-delete', 20);

export const taskDeleteLimiter = createTenantUserLimiter('task-delete', 20);
export const userDeleteLimiter = createTenantUserLimiter('user-delete', 10);
export const formDeleteLimiter = createTenantUserLimiter('form-delete', 15);

export { createTenantUserLimiter };

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicFormSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    const publicUrl = req.params?.publicUrl || 'unknown';
    return `public-form-submit:${ip}:${publicUrl}`;
  },
  message: 'Too many form submissions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many form submissions. Please try again later.',
      requestId: req.requestId,
    });
  },
});

export const publicFormGetLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    return `public-form-get:${ip}`;
  },
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests. Please try again later.',
    });
  },
});

export const teamInviteAcceptLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    const token = req.body?.token?.substring(0, 10) || 'unknown';
    return `team-invite-accept:${ip}:${token}`;
  },
  message: 'Too many invite acceptance attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many invite acceptance attempts. Please try again later.',
      requestId: req.requestId,
    });
  },
});

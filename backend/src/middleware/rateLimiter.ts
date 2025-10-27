import rateLimit from 'express-rate-limit';

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

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
});

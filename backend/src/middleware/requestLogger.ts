import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import { env } from '../config/env';

const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') return {};
  
  const sensitiveFields = ['password', 'token', 'refresh_token', 'access_token', 'csrf_token'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  if (env.NODE_ENV === 'production' && 'email' in sanitized) {
    const email = sanitized.email as string;
    if (email && email.includes('@')) {
      const [local, domain] = email.split('@');
      sanitized.email = `${local.substring(0, 2)}***@${domain}`;
    }
  }
  
  return sanitized;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userAgent = req.get('user-agent') ?? '';
    const fingerprintSource = `${req.ip ?? 'unknown'}|${userAgent}`;
    const clientFingerprint = crypto.createHash('sha256').update(fingerprintSource).digest('hex').slice(0, 16);

    const logData: any = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      tenantId: req.tenantId,
      userId: req.user?.id,
      clientFingerprint,
    };

    if (env.NODE_ENV !== 'production' && req.body && Object.keys(req.body).length > 0) {
      logData.body = sanitizeBody(req.body);
    }

    logger.info('HTTP request', logData);
  });

  next();
};

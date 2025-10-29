import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import { env } from '../config/env';

const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'token',
  'refresh_token',
  'access_token',
  'csrf_token',
  'secret',
  'api_key',
  'apiKey',
  'authorization',
  'newPassword',
  'oldPassword',
  'currentPassword',
  'passwordConfirm',
  'ssn',
  'creditCard',
  'cvv',
];

const sanitizeValue = (value: any, key: string): any => {
  if (typeof value === 'object' && value !== null) {
    return sanitizeBody(value);
  }
  
  if (typeof value === 'string') {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      return '[REDACTED]';
    }
    
    if (env.NODE_ENV === 'production' && lowerKey === 'email' && value.includes('@')) {
      const [local, domain] = value.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    }
  }
  
  return value;
};

const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') return {};
  
  const sanitized: any = Array.isArray(body) ? [] : {};
  
  for (const [key, value] of Object.entries(body)) {
    sanitized[key] = sanitizeValue(value, key);
  }
  
  return sanitized;
};

const sanitizeHeaders = (headers: any): any => {
  const sanitized = { ...headers };
  const sensitiveHeaderKeys = ['authorization', 'cookie', 'x-csrf-token', 'x-api-key'];
  
  for (const key of sensitiveHeaderKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
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

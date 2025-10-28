import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userAgent = req.get('user-agent') ?? '';
    const fingerprintSource = `${req.ip ?? 'unknown'}|${userAgent}`;
    const clientFingerprint = crypto.createHash('sha256').update(fingerprintSource).digest('hex').slice(0, 16);

    logger.info('HTTP request', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      tenantId: req.tenantId,
      userId: req.user?.id,
      clientFingerprint,
    });
  });

  next();
};

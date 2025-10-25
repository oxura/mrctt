import { Request, Response, NextFunction } from 'express';
import { AuditLogRepository } from '../repositories/auditLogRepository';
import logger from '../utils/logger';

const auditLogRepo = new AuditLogRepository();

export const auditLog = (action: string, resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function (body: any) {
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = body?.data?.id || req.params.id || null;

        const details: Record<string, unknown> = {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
        };

        if (req.body && Object.keys(req.body).length > 0) {
          const sanitizedBody = { ...req.body };
          delete (sanitizedBody as Record<string, unknown>).password;
          delete (sanitizedBody as Record<string, unknown>).password_hash;
          details.requestBody = sanitizedBody;
        }

        auditLogRepo
          .create({
            tenantId: req.tenantId ?? null,
            userId: req.user?.id ?? null,
            action,
            resourceType,
            resourceId,
            details,
            ipAddress:
              (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ||
              req.ip ||
              req.socket.remoteAddress ||
              null,
            userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
          })
          .catch((error) => {
            logger.warn('Failed to create audit log', {
              error: error instanceof Error ? error.message : error,
              action,
              resourceType,
            });
          });
      }

      return originalJson.call(this, body);
    };

    next();
  };
};

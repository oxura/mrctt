import { Request, Response } from 'express';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuditLogRepository } from '../repositories/auditLogRepository';

const auditRepo = new AuditLogRepository();

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError('Tenant not resolved', 400);
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const logs = await auditRepo.listByTenant(req.tenantId, limit, offset);

  res.status(200).json({
    status: 'success',
    data: { logs, limit, offset },
  });
});

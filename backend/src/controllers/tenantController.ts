import { Request, Response } from 'express';
import { TenantService } from '../services/tenantService';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';

const tenantService = new TenantService();

export const getCurrentTenant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError('Tenant not resolved', 400);
  }

  const tenant = await tenantService.getTenant(req.tenantId);

  res.status(200).json({
    status: 'success',
    data: { tenant },
  });
});

export const listTenants = asyncHandler(async (req: Request, res: Response) => {
  const tenants = await tenantService.listTenants();

  res.status(200).json({
    status: 'success',
    data: { tenants },
  });
});

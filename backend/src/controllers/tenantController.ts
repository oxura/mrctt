import { Request, Response } from 'express';
import { z } from 'zod';
import { TenantService } from '../services/tenantService';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';

const tenantService = new TenantService();

const updateOnboardingSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(60, 'Slug must not exceed 60 characters')
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Slug must start and end with alphanumeric characters, and contain only lowercase letters, numbers, and hyphens')
    .refine((val) => !val.includes('--'), 'Slug cannot contain consecutive hyphens')
    .optional(),
  logo_url: z.string().nullable().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
  modules: z.array(z.string()).optional(),
});

const leadStatusSchema = z.object({
  key: z.string().min(1, 'Status key is required'),
  label: z.string().min(1, 'Status label is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  order: z.number().int().min(0),
});

const updateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  logo_url: z.string().nullable().optional(),
  currency: z.string().min(3).max(3).optional(),
  modules: z.record(z.boolean()).optional(),
  lead_statuses: z.array(leadStatusSchema).optional(),
});

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

export const updateCurrentTenantOnboarding = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError('Tenant not resolved', 400);
  }

  const parsed = updateOnboardingSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const tenant = await tenantService.updateOnboarding(req.tenantId, parsed.data);

  res.status(200).json({
    status: 'success',
    data: { tenant },
  });
});

export const updateCurrentTenantSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError('Tenant not resolved', 400);
  }

  const parsed = updateSettingsSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const tenant = await tenantService.updateSettings(req.tenantId, parsed.data);

  res.status(200).json({
    status: 'success',
    data: { tenant },
  });
});

import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/express';
import { BillingService } from '../services/billingService';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/appError';
import { requireRole } from '../middleware/rbac';

const billingService = new BillingService();

const changePlanSchema = z.object({
  planId: z.string().min(1),
});

const renewSubscriptionSchema = z.object({
  months: z.number().int().positive().optional(),
});

export const getBillingOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  requireRole(req, ['owner']);

  if (!req.tenantId) {
    throw new AppError('Tenant context is required', 400);
  }

  const [subscription, payments, plans] = await Promise.all([
    billingService.getCurrentSubscription(req.tenantId),
    billingService.getPaymentHistory(req.tenantId),
    billingService.getSubscriptionPlans(),
  ]);

  res.json({
    subscription,
    payments,
    plans,
  });
});

export const changePlan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  requireRole(req, ['owner']);

  if (!req.tenantId) {
    throw new AppError('Tenant context is required', 400);
  }

  const parsed = changePlanSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const subscription = await billingService.changePlan(req.tenantId, parsed.data.planId);

  res.json(subscription);
});

export const renewSubscription = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  requireRole(req, ['owner']);

  if (!req.tenantId) {
    throw new AppError('Tenant context is required', 400);
  }

  const parsed = renewSubscriptionSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const subscription = await billingService.renewSubscription(req.tenantId, parsed.data.months ?? 1);

  res.json(subscription);
});

export const createManualPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  requireRole(req, ['owner']);

  if (!req.tenantId) {
    throw new AppError('Tenant context is required', 400);
  }

  const manualPaymentSchema = z.object({
    planId: z.string().min(1),
    amount: z.number().positive(),
    paymentMethod: z.string().optional(),
  });

  const parsed = manualPaymentSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const subscription = await billingService.getCurrentSubscription(req.tenantId);

  const payment = await billingService.createPayment(req.tenantId, {
    subscriptionId: subscription?.id,
    amount: parsed.data.amount,
    planId: parsed.data.planId,
    paymentMethod: parsed.data.paymentMethod ?? 'manual',
  });

  res.json(payment);
});

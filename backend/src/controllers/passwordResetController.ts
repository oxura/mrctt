import { Request, Response } from 'express';
import { z } from 'zod';
import { PasswordResetService } from '../services/passwordResetService';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';

const passwordResetService = new PasswordResetService();

const requestResetSchema = z.object({
  email: z.string().email(),
  tenantSlug: z.string().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const parsed = requestResetSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const startTime = Date.now();
  const minDelay = 200;
  const maxDelay = 400;
  const targetDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

  await passwordResetService.requestPasswordReset(
    parsed.data.email,
    parsed.data.tenantSlug
  );

  const elapsed = Date.now() - startTime;
  const remainingDelay = Math.max(0, targetDelay - elapsed);

  if (remainingDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  }

  res.status(200).json({
    status: 'success',
    message: 'If the email exists, a password reset link has been sent',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  await passwordResetService.resetPassword(parsed.data.token, parsed.data.password);

  res.status(200).json({
    status: 'success',
    message: 'Password has been reset successfully',
  });
});

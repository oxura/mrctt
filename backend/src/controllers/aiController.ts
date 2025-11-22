import { Request, Response } from 'express';
import { z } from 'zod';
import { AIService } from '../services/aiService';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';

const aiService = new AIService();

const commandSchema = z.object({
  command: z.string().min(1),
});

export const processAICommand = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.tenantId) {
    throw new AppError('Authentication required', 401);
  }

  const parsed = commandSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const result = await aiService.processCommand(parsed.data.command, req.user.id, req.tenantId);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

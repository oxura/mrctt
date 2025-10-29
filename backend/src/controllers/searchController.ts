import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/appError';
import leadsRepository from '../repositories/leadsRepository';

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(255, 'Search query too long'),
  page: z.coerce.number().int().min(1).optional().default(1),
  page_size: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const parsed = searchQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const { q, page, page_size } = parsed.data;

      const result = await leadsRepository.search(tenantId, q, page, page_size);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SearchController();

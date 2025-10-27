import { Request, Response, NextFunction } from 'express';
import commentsService from '../services/commentsService';
import { AppError } from '../utils/appError';
import { createCommentSchema } from '../validators/comments';

export class CommentsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { leadId } = req.params;

      const comments = await commentsService.getCommentsByLeadId(tenantId, leadId);

      res.status(200).json({
        status: 'success',
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { leadId } = req.params;

      const parsed = createCommentSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const comment = await commentsService.createComment(tenantId, leadId, userId, parsed.data);

      res.status(201).json({
        status: 'success',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentsController();

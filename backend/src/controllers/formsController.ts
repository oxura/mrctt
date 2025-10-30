import { Request, Response, NextFunction } from 'express';
import formsService from '../services/formsService';
import { AppError } from '../utils/appError';
import { formsListQuerySchema, createFormSchema, updateFormSchema, submitFormSchema } from '../validators/forms';
import logger from '../utils/logger';

class FormsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;

      const parsed = formsListQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const filters = {
        product_id: parsed.data.product_id,
        is_active: parsed.data.is_active,
        search: parsed.data.search,
        sort_by: parsed.data.sort_by,
        sort_direction: parsed.data.sort_direction || 'desc',
        page: parsed.data.page || 1,
        page_size: parsed.data.page_size || 25,
      };

      const result = await formsService.listForms(tenantId, filters, req.db);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { publicUrl } = req.params;

      if (!publicUrl) {
        throw new AppError('Public URL is required', 400);
      }

      const form = await formsService.getPublicForm(publicUrl, req.db);

      res.status(200).json({
        status: 'success',
        data: form,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return next(new AppError('Form not found or no longer available', error.statusCode));
      }
      next(new AppError('Unable to retrieve form', 500));
    }
  }

  async submitPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { publicUrl } = req.params;

      if (!publicUrl) {
        throw new AppError('Public URL is required', 400);
      }

      const parsed = submitFormSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
      const userAgent = req.headers['user-agent'] || null;

      const result = await formsService.submitPublicForm(
        publicUrl,
        {
          ...parsed.data,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        req.requestId,
        req.db
      );

      logger.info('Public form submission successful', {
        requestId: req.requestId,
        publicUrl,
        leadId: result.lead_id,
        ipAddress,
      });

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Form submitted successfully',
          lead_id: result.lead_id,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        if (error.statusCode === 400) {
          return next(error);
        }
        return next(new AppError('Unable to submit form. Please try again.', error.statusCode));
      }
      logger.error('Public form submission error', {
        requestId: req.requestId,
        publicUrl: req.params.publicUrl,
        error,
      });
      next(new AppError('Unable to submit form. Please try again.', 500));
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const parsed = createFormSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const form = await formsService.createForm(tenantId, userId, parsed.data, req.db);

      logger.info('Form created', {
        requestId: req.requestId,
        tenantId,
        userId,
        formId: form.id,
      });

      res.status(201).json({
        status: 'success',
        data: form,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      if (!id) {
        throw new AppError('Form ID is required', 400);
      }

      const form = await formsService.getForm(tenantId, id, req.db);

      res.status(200).json({
        status: 'success',
        data: form,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId;
      const { id } = req.params;

      if (!id) {
        throw new AppError('Form ID is required', 400);
      }

      const parsed = updateFormSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const form = await formsService.updateForm(tenantId, id, parsed.data, req.db);

      logger.info('Form updated', {
        requestId: req.requestId,
        tenantId,
        userId,
        formId: form.id,
      });

      res.status(200).json({
        status: 'success',
        data: form,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId;
      const { id } = req.params;

      if (!id) {
        throw new AppError('Form ID is required', 400);
      }

      await formsService.deleteForm(tenantId, id, req.db);

      logger.info('Form deleted', {
        requestId: req.requestId,
        tenantId,
        userId,
        formId: id,
      });

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Form deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async regeneratePublicUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId;
      const { id } = req.params;

      if (!id) {
        throw new AppError('Form ID is required', 400);
      }

      const form = await formsService.regeneratePublicUrl(tenantId, id, req.db);

      logger.info('Form public URL regenerated', {
        requestId: req.requestId,
        tenantId,
        userId,
        formId: form.id,
        oldPublicUrl: req.body.old_public_url,
        newPublicUrl: form.public_url,
      });

      res.status(200).json({
        status: 'success',
        data: form,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FormsController();

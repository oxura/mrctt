import { Request, Response, NextFunction } from 'express';
import formsService from '../services/formsService';
import { AppError } from '../utils/appError';
import { formsListQuerySchema, createFormSchema, updateFormSchema, submitFormSchema } from '../validators/forms';
import { verifyCaptchaToken } from '../utils/captcha';
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

      const result = await formsService.listForms(tenantId, filters);

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

      const form = await formsService.getPublicForm(publicUrl);

      res.status(200).json({
        status: 'success',
        data: form,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { publicUrl } = req.params;

      const payloadSize = Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8');
      const MAX_PAYLOAD_SIZE = 32 * 1024;

      if (payloadSize > MAX_PAYLOAD_SIZE) {
        logger.warn('Public form submission payload too large', {
          requestId: req.requestId,
          publicUrl,
          payloadSize,
        });
        throw new AppError('Payload too large', 413);
      }

      const parsed = submitFormSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const ipAddress = req.ip || null;
      const userAgent = req.get('user-agent') || null;

      await verifyCaptchaToken(parsed.data.captcha_token, ipAddress);

      const { captcha_token, ...formData } = parsed.data;

      const result = await formsService.submitPublicForm(publicUrl, formData, ipAddress, userAgent);

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Form submitted successfully',
          lead_id: result.lead_id,
        },
      });
    } catch (error) {
      next(error);
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

      const form = await formsService.createForm(tenantId, userId, parsed.data);

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

      const form = await formsService.getForm(tenantId, id);

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
      const { id } = req.params;

      const parsed = updateFormSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const form = await formsService.updateForm(tenantId, id, parsed.data);

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
      const { id } = req.params;

      await formsService.deleteForm(tenantId, id);

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
      const { id } = req.params;

      const form = await formsService.regeneratePublicUrl(tenantId, id);

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

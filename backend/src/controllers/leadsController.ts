import { Request, Response, NextFunction } from 'express';
import leadsService from '../services/leadsService';
import { AppError } from '../utils/appError';
import {
  leadsListQuerySchema,
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
} from '../validators/leads';

export class LeadsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;

      const parsed = leadsListQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const filters = {
        status: parsed.data.status,
        assigned_to: parsed.data.assigned_to,
        product_id: parsed.data.product_id,
        search: parsed.data.search,
        sort_by: parsed.data.sort_by,
        sort_direction: parsed.data.sort_direction || 'desc',
        page: parsed.data.page || 1,
        page_size: parsed.data.page_size || 25,
      };

      const result = await leadsService.listLeads(tenantId, filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id;

      const parsed = createLeadSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const lead = await leadsService.createLead(tenantId, parsed.data, userId);

      res.status(201).json({
        status: 'success',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const lead = await leadsService.getLead(tenantId, id);

      res.status(200).json({
        status: 'success',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id;
      const { id } = req.params;

      const parsed = updateLeadSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const lead = await leadsService.updateLead(tenantId, id, parsed.data, userId);

      res.status(200).json({
        status: 'success',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id;
      const { id } = req.params;

      const parsed = updateLeadStatusSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const lead = await leadsService.updateLeadStatus(tenantId, id, parsed.data.status, userId);

      res.status(200).json({
        status: 'success',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id;
      const { id } = req.params;

      await leadsService.deleteLead(tenantId, id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LeadsController();

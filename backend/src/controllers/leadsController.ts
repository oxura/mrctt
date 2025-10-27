import { Request, Response, NextFunction } from 'express';
import leadsService from '../services/leadsService';

export class LeadsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const {
        status,
        assigned_to,
        product_id,
        search,
        sort_by,
        sort_direction,
        page,
        page_size,
      } = req.query;

      const filters = {
        status: status as string | undefined,
        assigned_to: assigned_to as string | undefined,
        product_id: product_id as string | undefined,
        search: search as string | undefined,
        sort_by: sort_by as string | undefined,
        sort_direction: (sort_direction as 'asc' | 'desc') || 'desc',
        page: page ? parseInt(page as string, 10) : 1,
        page_size: page_size ? parseInt(page_size as string, 10) : 25,
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
      const leadData = req.body;

      const lead = await leadsService.createLead(tenantId, leadData, userId);

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
      const updateData = req.body;

      const lead = await leadsService.updateLead(tenantId, id, updateData, userId);

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
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          status: 'error',
          message: 'Status is required',
        });
      }

      const lead = await leadsService.updateLeadStatus(tenantId, id, status, userId);

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

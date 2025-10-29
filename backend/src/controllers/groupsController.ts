import { Request, Response, NextFunction } from 'express';
import groupsService from '../services/groupsService';
import { AppError } from '../utils/appError';
import {
  groupsListQuerySchema,
  createGroupSchema,
  updateGroupSchema,
} from '../validators/groups';

export class GroupsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;

      const parsed = groupsListQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const filters = {
        product_id: parsed.data.product_id,
        status: parsed.data.status,
        search: parsed.data.search,
        sort_by: parsed.data.sort_by,
        sort_direction: parsed.data.sort_direction || 'desc',
        page: parsed.data.page || 1,
        page_size: parsed.data.page_size || 25,
      };

      const result = await groupsService.listGroups(tenantId, filters);

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

      const parsed = createGroupSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const group = await groupsService.createGroup(tenantId, parsed.data);

      res.status(201).json({
        status: 'success',
        data: group,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const group = await groupsService.getGroup(tenantId, id);

      res.status(200).json({
        status: 'success',
        data: group,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const parsed = updateGroupSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const group = await groupsService.updateGroup(tenantId, id, parsed.data);

      res.status(200).json({
        status: 'success',
        data: group,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await groupsService.deleteGroup(tenantId, id);

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Group deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new GroupsController();

import { Request, Response, NextFunction } from 'express';
import activitiesService from '../services/activitiesService';

export class ActivitiesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { leadId } = req.params;

      const activities = await activitiesService.getActivitiesByLeadId(tenantId, leadId);

      res.status(200).json({
        status: 'success',
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ActivitiesController();

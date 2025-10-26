import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboardService';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const stats = await dashboardService.getStats(tenantId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLeadsChart(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const days = parseInt(req.query.days as string) || 30;

      const chartData = await dashboardService.getLeadsChart(tenantId, days);

      res.status(200).json({
        status: 'success',
        data: chartData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const limit = parseInt(req.query.limit as string) || 10;

      const activities = await dashboardService.getActivityFeed(tenantId, limit);

      res.status(200).json({
        status: 'success',
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      const tasks = await dashboardService.getMyTasks(tenantId, userId);

      res.status(200).json({
        status: 'success',
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTaskCompletion(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { taskId } = req.params;
      const { isCompleted } = req.body;

      if (typeof isCompleted !== 'boolean') {
        return res.status(400).json({
          status: 'error',
          message: 'isCompleted must be a boolean',
        });
      }

      await dashboardService.updateTaskCompletion(tenantId, taskId, isCompleted);

      res.status(200).json({
        status: 'success',
        message: 'Task updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();

import { Request, Response, NextFunction } from 'express';
import tasksService from '../services/tasksService';
import { AppError } from '../utils/appError';
import { createTaskSchema, updateTaskSchema } from '../validators/tasks';

export class TasksController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { leadId } = req.params;

      const tasks = await tasksService.getTasksByLeadId(tenantId, leadId);

      res.status(200).json({
        status: 'success',
        data: tasks,
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

      const parsed = createTaskSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const task = await tasksService.createTask(tenantId, leadId, userId, parsed.data);

      res.status(201).json({
        status: 'success',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { taskId } = req.params;

      const parsed = updateTaskSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const task = await tasksService.updateTask(tenantId, taskId, parsed.data);

      res.status(200).json({
        status: 'success',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { taskId } = req.params;

      await tasksService.deleteTask(tenantId, taskId);

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Task deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TasksController();

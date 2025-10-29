import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { pool } from '../db/client';

export const requireModule = (moduleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return next(new AppError('Tenant not found', 400));
      }

      const query = `
        SELECT settings
        FROM tenants
        WHERE id = $1
      `;

      const result = await pool.query(query, [tenantId]);

      if (result.rows.length === 0) {
        return next(new AppError('Tenant not found', 404));
      }

      const settings = result.rows[0].settings || {};
      const modules = settings.modules || {};

      if (modules[moduleName] === false) {
        return next(
          new AppError(`Module '${moduleName}' is disabled for this tenant`, 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

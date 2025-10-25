import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { verifyToken } from '../utils/jwt';
import { pool } from '../db/client';
import { User } from '../types/models';
import { PermissionRepository } from '../repositories/permissionRepository';

const permissionRepo = new PermissionRepository();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = result.rows[0];
    req.tenantId = result.rows[0].tenant_id || undefined;

    const permissions = await permissionRepo.getPermissionsByUserId(req.user.id);
    req.permissions = permissions.map((permission) => permission.name);

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

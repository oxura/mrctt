import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { PermissionRepository } from '../repositories/permissionRepository';
import { pool } from '../db/client';

const permissionRepo = new PermissionRepository();

const ensurePermissionsLoaded = async (req: Request) => {
  if (!req.permissions && req.user) {
    const permissions = await permissionRepo.getPermissionsByUserId(req.user.id);
    req.permissions = permissions.map((permission) => permission.name);
  }
};

const hasPermissionInRequest = (req: Request, permissionName: string) => {
  return req.permissions?.includes(permissionName) ?? false;
};

/**
 * Middleware to check if user has a specific permission
 * @param permissionName - The permission name to check (e.g., 'leads:read:all')
 */
export const requirePermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      await ensurePermissionsLoaded(req);
      const hasPermission = hasPermissionInRequest(req, permissionName);

      if (!hasPermission) {
        return next(
          new AppError(
            `Insufficient permissions. Required: ${permissionName}`,
            403
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 * @param permissionNames - Array of permission names
 */
export const requireAnyPermission = (...permissionNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      await ensurePermissionsLoaded(req);
      const hasPermission = permissionNames.some((permissionName) =>
        hasPermissionInRequest(req, permissionName)
      );

      if (!hasPermission) {
        return next(
          new AppError(
            `Insufficient permissions. Required one of: ${permissionNames.join(', ')}`,
            403
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has all specified permissions
 * @param permissionNames - Array of permission names
 */
export const requireAllPermissions = (...permissionNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      await ensurePermissionsLoaded(req);

      for (const permissionName of permissionNames) {
        const hasPermission = hasPermissionInRequest(req, permissionName);

        if (!hasPermission) {
          return next(
            new AppError(
              `Insufficient permissions. Required: ${permissionName}`,
              403
            )
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper to check permissions programmatically within controllers
 */
export const checkPermission = async (
  userId: string,
  permissionName: string
): Promise<boolean> => {
  return permissionRepo.hasPermission(userId, permissionName);
};

/**
 * Helper to check if user owns the resource
 * This should be combined with permission checks for :own scope
 */
export const isResourceOwner = (
  userId: string,
  resourceOwnerId: string | null | undefined
): boolean => {
  if (!resourceOwnerId) return false;
  return userId === resourceOwnerId;
};

/**
 * Combined middleware: checks permission and ownership
 * For scoped permissions like 'leads:update:own'
 * Uses a getResourceOwnerId function that returns null if resource doesn't exist
 * to prevent information leakage about resource existence
 */
export const requirePermissionWithOwnership = (
  permissionAll: string,
  permissionOwn: string,
  getResourceOwnerId: (req: Request) => Promise<string | null>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      await ensurePermissionsLoaded(req);

      const hasAllPermission = hasPermissionInRequest(req, permissionAll);

      if (hasAllPermission) {
        return next();
      }

      const hasOwnPermission = hasPermissionInRequest(req, permissionOwn);

      if (!hasOwnPermission) {
        return next(
          new AppError(
            `Insufficient permissions. Required: ${permissionAll} or ${permissionOwn}`,
            403
          )
        );
      }

      const resourceOwnerId = await getResourceOwnerId(req);

      if (resourceOwnerId === null || !isResourceOwner(req.user.id, resourceOwnerId)) {
        return next(new AppError('Access denied. You can only access your own resources.', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const getLeadOwnerId = async (tenantId: string, leadId: string): Promise<string | null> => {
  const result = await pool.query<{ assigned_to: string | null }>(
    `SELECT assigned_to FROM leads WHERE id = $1 AND tenant_id = $2`,
    [leadId, tenantId]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0].assigned_to ?? null;
};

export const getTaskOwnerId = async (tenantId: string, taskId: string): Promise<string | null> => {
  const result = await pool.query<{ assigned_to: string | null }>(
    `SELECT assigned_to FROM tasks WHERE id = $1 AND tenant_id = $2`,
    [taskId, tenantId]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0].assigned_to ?? null;
};

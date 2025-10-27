import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { pool } from '../db/client';
import { Tenant } from '../types/models';

const resolveTenantId = (req: Request): string | undefined => {
  if (req.headers['x-tenant-id']) {
    return Array.isArray(req.headers['x-tenant-id'])
      ? req.headers['x-tenant-id'][0]
      : (req.headers['x-tenant-id'] as string);
  }

  if (req.headers.host) {
    const parts = req.headers.host.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
  }

  return undefined;
};

export const tenantGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resolvedTenant = resolveTenantId(req);

    if (!req.user && !resolvedTenant) {
      throw new AppError('Tenant context is required', 400);
    }

    if (req.user) {
      if (req.user.role === 'platform_owner') {
        if (!resolvedTenant) {
          throw new AppError('Tenant identifier is required for platform owner', 400);
        }
        req.tenantId = resolvedTenant;
      } else {
        const userTenantId = req.user.tenant_id;
        if (!userTenantId) {
          throw new AppError('User has no associated tenant', 403);
        }

        if (resolvedTenant) {
          const tenantCheckResult = await pool.query(
            'SELECT id FROM tenants WHERE (id::text = $1 OR slug = $1) AND is_active = true',
            [resolvedTenant]
          );

          if (tenantCheckResult.rows.length === 0) {
            throw new AppError('Tenant not found or inactive', 404);
          }

          const resolvedTenantId = tenantCheckResult.rows[0].id;

          if (resolvedTenantId !== userTenantId) {
            throw new AppError('Access denied: cannot access other tenant resources', 403);
          }
        }

        req.tenantId = userTenantId;
      }
    } else if (resolvedTenant) {
      req.tenantId = resolvedTenant;
    }

    if (!req.tenantId) {
      throw new AppError('Unable to resolve tenant context', 400);
    }

    const tenantResult = await pool.query(
      'SELECT * FROM tenants WHERE (id::text = $1 OR slug = $1) AND is_active = true',
      [req.tenantId]
    );

    if (tenantResult.rows.length === 0) {
      throw new AppError('Tenant not found or inactive', 404);
    }

    const tenant = tenantResult.rows[0] as Tenant;

    req.tenantId = tenant.id;

    res.locals.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};

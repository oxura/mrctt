import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { pool } from '../db/client';
import { Tenant } from '../types/models';
import logger from '../utils/logger';

const resolveTenantIdentifier = (req: Request): string | undefined => {
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
    const incomingIdentifier = resolveTenantIdentifier(req);

    if (req.user) {
      if (req.user.role === 'platform_owner') {
        if (!incomingIdentifier) {
          throw new AppError('Tenant identifier is required for platform owner', 400);
        }
        
        const tenantResult = await pool.query<Tenant>(
          'SELECT * FROM tenants WHERE (id::text = $1 OR slug = $1) AND is_active = true',
          [incomingIdentifier]
        );

        if (tenantResult.rows.length === 0) {
          logger.warn('Tenant access denied for platform owner', {
            requestId: req.requestId,
            userId: req.user.id,
            identifier: incomingIdentifier,
          });
          throw new AppError('Tenant not found or inactive', 404);
        }

        const tenant = tenantResult.rows[0];
        req.tenantId = tenant.id;
        res.locals.tenant = tenant;
      } else {
        const userTenantId = req.user.tenant_id;
        if (!userTenantId) {
          throw new AppError('User has no associated tenant', 403);
        }

        if (incomingIdentifier && incomingIdentifier !== userTenantId) {
          const tenantCheckResult = await pool.query(
            'SELECT id FROM tenants WHERE (id::text = $1 OR slug = $1) AND is_active = true',
            [incomingIdentifier]
          );

          if (tenantCheckResult.rows.length === 0 || tenantCheckResult.rows[0].id !== userTenantId) {
            logger.warn('Tenant access denied: header spoofing attempt', {
              requestId: req.requestId,
              userId: req.user.id,
              userTenantId,
              attemptedIdentifier: incomingIdentifier,
            });
            throw new AppError('Access denied: cannot access other tenant resources', 403);
          }
        }

        req.tenantId = userTenantId;
        
        const tenantResult = await pool.query<Tenant>(
          'SELECT * FROM tenants WHERE id = $1 AND is_active = true',
          [userTenantId]
        );

        if (tenantResult.rows.length === 0) {
          throw new AppError('Tenant not found or inactive', 404);
        }

        res.locals.tenant = tenantResult.rows[0];
      }
    } else if (incomingIdentifier) {
      const tenantResult = await pool.query<Tenant>(
        'SELECT * FROM tenants WHERE (id::text = $1 OR slug = $1) AND is_active = true',
        [incomingIdentifier]
      );

      if (tenantResult.rows.length === 0) {
        throw new AppError('Tenant not found or inactive', 404);
      }

      const tenant = tenantResult.rows[0];
      req.tenantId = tenant.id;
      res.locals.tenant = tenant;
    } else {
      throw new AppError('Tenant context is required', 400);
    }

    if (!req.tenantId) {
      throw new AppError('Unable to resolve tenant context', 400);
    }

    await pool.query('SELECT set_config($1, $2, true)', ['app.tenant_id', req.tenantId]);

    next();
  } catch (error) {
    next(error);
  }
};

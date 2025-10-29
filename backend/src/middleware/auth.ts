import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { verifyToken } from '../utils/jwt';
import { pool, PoolClientLike } from '../db/client';
import { User } from '../types/models';
import { PermissionRepository } from '../repositories/permissionRepository';
import { env } from '../config/env';
import logger from '../utils/logger';

const permissionRepo = new PermissionRepository();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      if (env.NODE_ENV === 'production' && !env.ALLOW_BEARER_TOKENS) {
        logger.warn('Bearer token rejected in production', {
          requestId: req.requestId,
          ip: req.ip,
          path: req.originalUrl,
          userAgent: req.headers['user-agent'],
        });
        throw new AppError('Bearer tokens not supported for browser clients in production. Use cookies.', 401);
      }
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = verifyToken(token);

    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or inactive', 401);
    }

    const user = result.rows[0];

    if (decoded.tokenVersion !== undefined && user.token_version !== decoded.tokenVersion) {
      logger.warn('Token version mismatch - token revoked', {
        userId: user.id,
        jti: decoded.jti,
        expectedVersion: user.token_version,
        tokenVersion: decoded.tokenVersion,
      });
      throw new AppError('Token has been revoked', 401);
    }

    req.user = user;

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

export const revokeUserTokens = async (
  userId: string,
  client: PoolClientLike = pool
): Promise<void> => {
  await client.query(
    'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
    [userId]
  );
};

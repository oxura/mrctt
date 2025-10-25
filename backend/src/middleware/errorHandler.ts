import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from '../utils/appError';
import logger from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (isAppError(error)) {
    logger.error('Operational error:', {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      path: req.path,
      method: req.method,
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
    });

    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  logger.error('Unexpected error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = 500;
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message || 'Something went wrong';

  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

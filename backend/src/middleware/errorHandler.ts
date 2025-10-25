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

    const response: any = {
      status: 'error',
      message: error.message,
    };

    if (error.details) {
      response.details = error.details;
    }

    return res.status(error.statusCode).json(response);
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

  const response: any = {
    status: 'error',
    message,
  };

  if (env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
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

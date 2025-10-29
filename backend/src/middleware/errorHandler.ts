import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../utils/appError';
import logger from '../utils/logger';
import { env } from '../config/env';

const sanitizeErrorMessage = (message?: string): string => {
  if (!message) {
    return '';
  }
  const patterns = [
    { regex: /\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
    { regex: /\b[A-Za-z0-9]{20,}\b/g, replacement: '[TOKEN]' },
    { regex: /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, replacement: '[JWT]' },
    { regex: /password[:\s=]+[^\s,}]+/gi, replacement: 'password:[REDACTED]' },
  ];
  
  let sanitized = message;
  patterns.forEach(({ regex, replacement }) => {
    sanitized = sanitized.replace(regex, replacement);
  });
  
  return sanitized;
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (isAppError(error)) {
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    
    logger.error('Operational error:', {
      requestId: req.requestId,
      message: sanitizedMessage,
      statusCode: error.statusCode,
      details: error.details,
      path: req.path,
      method: req.method,
      tenantId: req.tenantId,
      userId: req.user?.id,
    });

    const response: any = {
      status: 'error',
      message: error.message,
      requestId: req.requestId,
    };

    if (error.details) {
      response.details = error.details;
    }

    res.setHeader('X-Request-ID', req.requestId || 'unknown');
    return res.status(error.statusCode).json(response);
  }

  const sanitizedMessage = sanitizeErrorMessage(error.message);
  const sanitizedStack = env.NODE_ENV === 'production' ? undefined : sanitizeErrorMessage(error.stack || '');
  
  logger.error('Unexpected error:', {
    requestId: req.requestId,
    message: sanitizedMessage,
    stack: sanitizedStack,
    path: req.path,
    method: req.method,
    tenantId: req.tenantId,
    userId: req.user?.id,
  });

  const statusCode = 500;
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message || 'Something went wrong';

  const response: any = {
    status: 'error',
    message,
    requestId: req.requestId,
  };

  if (env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  res.setHeader('X-Request-ID', req.requestId || 'unknown');
  return res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    requestId: req.requestId,
  });
};

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>;

export const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

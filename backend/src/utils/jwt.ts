import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './appError';

export interface JwtPayload {
  userId: string;
  tenantId?: string;
  role: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET as jwt.Secret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
};

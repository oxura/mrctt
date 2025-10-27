import crypto from 'crypto';

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const verifyCSRFToken = (token1: string, token2: string): boolean => {
  if (!token1 || !token2) return false;
  return crypto.timingSafeEqual(Buffer.from(token1), Buffer.from(token2));
};

import bcrypt from 'bcryptjs';
import { AppError } from './appError';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string) => {
  const isValid = await bcrypt.compare(password, hash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }
  return isValid;
};

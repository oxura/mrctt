import crypto from 'crypto';
import { AppError } from '../utils/appError';
import { hashPassword } from '../utils/password';
import { UserRepository } from '../repositories/userRepository';
import { TenantRepository } from '../repositories/tenantRepository';
import { PasswordResetRepository } from '../repositories/passwordResetRepository';
import { withTransaction } from '../db/client';
import logger from '../utils/logger';
import { env } from '../config/env';
import { emailService } from './emailService';

const RESET_TOKEN_EXPIRY_HOURS = 1;

export class PasswordResetService {
  private userRepo: UserRepository;
  private tenantRepo: TenantRepository;
  private resetRepo: PasswordResetRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.tenantRepo = new TenantRepository();
    this.resetRepo = new PasswordResetRepository();
  }

  async requestPasswordReset(email: string, tenantSlug: string) {
    const tenant = await this.tenantRepo.findBySlug(tenantSlug);

    if (!tenant || !tenant.is_active) {
      logger.warn(`Password reset attempt for non-existent tenant: ${tenantSlug}`);
      return { success: true };
    }

    const user = await this.userRepo.findByEmail(email, tenant.id);

    if (!user || !user.is_active) {
      logger.warn(`Password reset attempt for non-existent user: ${email} in tenant: ${tenantSlug}`);
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    await this.resetRepo.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    await emailService.sendPasswordResetEmail(user.email, resetUrl, user.first_name ?? undefined);

    logger.info(`Password reset requested for user: ${user.id}`, {
      userId: user.id,
      tenantId: tenant.id,
    });

    return {
      success: true,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.resetRepo.findByToken(token);

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const user = await this.userRepo.findById(resetToken.user_id);

    if (!user || !user.is_active) {
      throw new AppError('User not found or inactive', 404);
    }

    const passwordHash = await hashPassword(newPassword);

    await withTransaction(async (client) => {
      await this.userRepo.updatePassword(user.id, passwordHash, client);
      await this.resetRepo.markAsUsed(token, client);
    });

    logger.info(`Password reset completed for user: ${user.id}`);

    return { success: true };
  }

  async cleanupExpiredTokens() {
    await this.resetRepo.deleteExpired();
    logger.info('Cleaned up expired password reset tokens');
  }
}

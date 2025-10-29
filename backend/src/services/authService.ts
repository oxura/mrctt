import crypto from 'crypto';
import { AppError } from '../utils/appError';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { generateRefreshToken } from '../utils/tokens';
import { withTransaction } from '../db/client';
import { revokeUserTokens } from '../middleware/auth';
import { UserRepository } from '../repositories/userRepository';
import { TenantRepository } from '../repositories/tenantRepository';
import { RefreshTokenRepository } from '../repositories/refreshTokenRepository';
import { LoginAttemptRepository } from '../repositories/loginAttemptRepository';
import { AuditService } from './auditService';
import { emailService } from './emailService';
import logger from '../utils/logger';
import { env } from '../config/env';
import { parseDuration } from '../utils/time';

const normalizeSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
}

interface LoginData {
  email: string;
  password: string;
  tenantSlug: string;
}

export class AuthService {
  private userRepo: UserRepository;
  private tenantRepo: TenantRepository;
  private refreshTokenRepo: RefreshTokenRepository;
  private loginAttemptRepo: LoginAttemptRepository;
  private auditService: AuditService;

  constructor() {
    this.userRepo = new UserRepository();
    this.tenantRepo = new TenantRepository();
    this.refreshTokenRepo = new RefreshTokenRepository();
    this.loginAttemptRepo = new LoginAttemptRepository();
    this.auditService = new AuditService();
  }

  async register(data: RegisterData) {
    const existingUser = await this.userRepo.findByEmailGlobal(data.email);

    if (existingUser) {
      throw new AppError('Email is already in use', 409);
    }

    const result = await withTransaction(async (client) => {
      const baseName = data.firstName ? `Компания ${data.firstName}` : 'Новая компания';
      const emailUsername = data.email.split('@')[0];
      const baseSlugCandidate = normalizeSlug(emailUsername);
      const slugSeed = baseSlugCandidate || 'workspace';
      
      let slug = slugSeed;
      let slugCounter = 0;
      let existingTenant = await this.tenantRepo.findBySlug(slug, client);

      while (existingTenant) {
        slugCounter++;
        slug = `${slugSeed}-${slugCounter}`;
        existingTenant = await this.tenantRepo.findBySlug(slug, client);
      }

      const tenant = await this.tenantRepo.create(
        {
          name: baseName,
          slug: slug,
        },
        client
      );

      const passwordHash = await hashPassword(data.password);

      const user = await this.userRepo.create(
        {
          tenant_id: tenant.id,
          email: data.email,
          password_hash: passwordHash,
          first_name: data.firstName,
        },
        client
      );

      const token = generateToken({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
        tokenVersion: user.token_version,
      });

      const { password_hash: passwordHashColumn, ...userWithoutPassword } = user;
      void passwordHashColumn;

      return {
        user: userWithoutPassword,
        tenant,
        token,
      };
    });

    await emailService.sendWelcomeEmail(
      result.user.email,
      result.user.first_name ?? undefined,
      result.tenant.name
    );

    return result;
  }

  async login(data: LoginData, ipAddress?: string) {
    const lockout = await this.loginAttemptRepo.getLockout(data.email, data.tenantSlug);
    if (lockout) {
      const timeLeftMs = new Date(lockout.locked_until).getTime() - Date.now();
      const timeLeftMin = Math.ceil(timeLeftMs / 60000);
      throw new AppError(`Account locked due to too many failed login attempts. Try again in ${timeLeftMin} minute(s).`, 429);
    }

    const tenant = await this.tenantRepo.findBySlug(data.tenantSlug);

    if (!tenant || !tenant.is_active) {
      await this.loginAttemptRepo.create({
        email: data.email,
        tenant_slug: data.tenantSlug,
        ip_address: ipAddress,
        success: false,
      });
      const failures = await this.loginAttemptRepo.countFailedAttempts(data.email, data.tenantSlug);
      if (failures >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await this.loginAttemptRepo.createLockout(data.email, data.tenantSlug, lockUntil);
      }
      throw new AppError('Invalid credentials', 401);
    }

    const user = await this.userRepo.findByEmail(data.email, tenant.id);

    if (!user || !user.is_active) {
      await this.loginAttemptRepo.create({
        email: data.email,
        tenant_slug: data.tenantSlug,
        ip_address: ipAddress,
        success: false,
      });
      const failures = await this.loginAttemptRepo.countFailedAttempts(data.email, data.tenantSlug);
      if (failures >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await this.loginAttemptRepo.createLockout(data.email, data.tenantSlug, lockUntil);
      }
      throw new AppError('Invalid credentials', 401);
    }

    try {
      await verifyPassword(data.password, user.password_hash);
    } catch (error) {
      await this.loginAttemptRepo.create({
        email: data.email,
        tenant_slug: data.tenantSlug,
        ip_address: ipAddress,
        success: false,
      });
      const failures = await this.loginAttemptRepo.countFailedAttempts(data.email, data.tenantSlug);
      if (failures >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await this.loginAttemptRepo.createLockout(data.email, data.tenantSlug, lockUntil);
      }
      throw error;
    }

    await this.loginAttemptRepo.create({
      email: data.email,
      tenant_slug: data.tenantSlug,
      ip_address: ipAddress,
      success: true,
    });

    await this.loginAttemptRepo.clearLockout(data.email, data.tenantSlug);

    await this.userRepo.updateLastLogin(user.id);

    const token = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      tokenVersion: user.token_version,
    });

    const refreshToken = generateRefreshToken();
    const tokenFamilyId = crypto.randomUUID();
    const refreshTokenDuration = parseDuration(env.REFRESH_TOKEN_EXPIRES_IN || '7d');
    const refreshExpiresAt = new Date(Date.now() + refreshTokenDuration);

    await this.refreshTokenRepo.create({
      user_id: user.id,
      tenant_id: tenant.id,
      token: refreshToken,
      expires_at: refreshExpiresAt,
      token_family_id: tokenFamilyId,
    });

    const { password_hash: passwordHash2, ...userWithoutPassword } = user;
    void passwordHash2;

    return {
      user: userWithoutPassword,
      tenant,
      token,
      refreshToken,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password_hash: passwordHash3, ...userWithoutPassword } = user;
    void passwordHash3;

    return userWithoutPassword;
  }

  async refreshAccessToken(refreshToken: string, userId: string, tenantId: string) {
    const storedToken = await this.refreshTokenRepo.findByToken(refreshToken, userId, tenantId);

    if (!storedToken) {
      logger.warn('Refresh token not found', {
        userId,
        tenantId,
        refreshTokenPreview: refreshToken.slice(0, 8),
      });
      throw new AppError('Invalid or expired refresh token', 401);
    }

    if (storedToken.is_revoked) {
      if (storedToken.token_family_id) {
        await this.refreshTokenRepo.revokeTokenFamily(storedToken.token_family_id, tenantId);
      } else {
        await this.refreshTokenRepo.revokeAllUserTokens(userId, tenantId);
      }

      logger.warn('Revoked refresh token reuse detected - revoking token family', {
        userId,
        tenantId,
        tokenId: storedToken.id,
        tokenFamilyId: storedToken.token_family_id,
      });

      this.auditService
        .record({
          tenantId,
          userId,
          action: 'auth.refresh.reuse_detected',
          resourceType: 'auth_session',
          resourceId: storedToken.id,
          details: {
            tokenId: storedToken.id,
            tokenFamilyId: storedToken.token_family_id,
          },
        })
        .catch((err) => {
          logger.warn('Failed to record audit event for refresh token reuse', { error: err });
        });

      throw new AppError('Invalid or expired refresh token', 401);
    }

    if (storedToken.expires_at <= new Date()) {
      await this.refreshTokenRepo.revokeToken(storedToken.id);
      logger.warn('Expired refresh token attempt', { userId, tenantId });
      throw new AppError('Refresh token has expired', 401);
    }

    await this.refreshTokenRepo.markTokenUsed(storedToken.id);

    const user = await this.userRepo.findById(userId);
    if (!user || !user.is_active) {
      throw new AppError('User not found or inactive', 401);
    }

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || !tenant.is_active) {
      throw new AppError('Tenant not found or inactive', 401);
    }

    const newToken = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      tokenVersion: user.token_version,
    });

    const newRefreshToken = generateRefreshToken();
    const refreshTokenDuration = parseDuration(env.REFRESH_TOKEN_EXPIRES_IN || '7d');
    const refreshExpiresAt = new Date(Date.now() + refreshTokenDuration);
    const tokenFamilyId = storedToken.token_family_id ?? crypto.randomUUID();

    await this.refreshTokenRepo.revokeAndCreateNew(storedToken.id, {
      user_id: user.id,
      tenant_id: tenant.id,
      token: newRefreshToken,
      expires_at: refreshExpiresAt,
      token_family_id: tokenFamilyId,
    });

    this.auditService
      .record({
        tenantId: tenant.id,
        userId: user.id,
        action: 'auth.refresh.success',
        resourceType: 'auth_session',
        resourceId: storedToken.id,
        details: {
          oldTokenId: storedToken.id,
          tokenFamilyId,
        },
      })
      .catch((err) => {
        logger.warn('Failed to record audit event for refresh', { error: err });
      });

    const { password_hash: passwordHashColumn, ...userWithoutPassword } = user;
    void passwordHashColumn;

    return {
      user: userWithoutPassword,
      tenant,
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, tenantId?: string | null) {
    if (tenantId) {
      await this.refreshTokenRepo.revokeAllUserTokens(userId, tenantId);
    }
    await revokeUserTokens(userId);
  }
}

import { AppError } from '../utils/appError';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { withTransaction } from '../db/client';
import { UserRepository } from '../repositories/userRepository';
import { TenantRepository } from '../repositories/tenantRepository';
import { emailService } from './emailService';

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

  constructor() {
    this.userRepo = new UserRepository();
    this.tenantRepo = new TenantRepository();
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

  async login(data: LoginData) {
    const tenant = await this.tenantRepo.findBySlug(data.tenantSlug);

    if (!tenant || !tenant.is_active) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = await this.userRepo.findByEmail(data.email, tenant.id);

    if (!user || !user.is_active) {
      throw new AppError('Invalid credentials', 401);
    }

    await verifyPassword(data.password, user.password_hash);

    await this.userRepo.updateLastLogin(user.id);

    const token = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    });

    const { password_hash: passwordHash2, ...userWithoutPassword } = user;
    void passwordHash2;

    return {
      user: userWithoutPassword,
      tenant,
      token,
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
}

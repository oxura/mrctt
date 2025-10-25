import { AppError } from '../utils/appError';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { withTransaction } from '../db/client';
import { UserRepository } from '../repositories/userRepository';
import { TenantRepository } from '../repositories/tenantRepository';
import { emailService } from './emailService';

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName: string;
  companySlug: string;
  country?: string;
  city?: string;
  industry?: string;
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
    const normalizedSlug = data.companySlug.trim().toLowerCase();

    const existingTenant = await this.tenantRepo.findBySlug(normalizedSlug);

    if (existingTenant) {
      throw new AppError('Company slug already exists', 409);
    }

    const existingUser = await this.userRepo.findByEmailGlobal(data.email);

    if (existingUser) {
      throw new AppError('Email is already in use', 409);
    }

    const result = await withTransaction(async (client) => {
      const tenant = await this.tenantRepo.create(
        {
          name: data.companyName,
          slug: normalizedSlug,
          country: data.country,
          city: data.city,
          industry: data.industry,
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
          last_name: data.lastName,
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

import { AppError } from '../utils/appError';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { withTransaction } from '../db/client';
import { UserRepository } from '../repositories/userRepository';
import { TenantRepository } from '../repositories/tenantRepository';

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
    const normalizedSlug = data.companySlug.toLowerCase();

    const existingTenant = await this.tenantRepo.findBySlug(normalizedSlug);

    if (existingTenant) {
      throw new AppError('Company slug already exists', 409);
    }

    const existingUser = await this.userRepo.findByEmailGlobal(data.email);

    if (existingUser) {
      throw new AppError('Email is already in use', 409);
    }

    return withTransaction(async (client) => {
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
          role: 'owner',
        },
        client
      );

      const token = generateToken({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
      });

      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        tenant,
        token,
      };
    });
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

    const { password_hash, ...userWithoutPassword } = user;

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

    const { password_hash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}

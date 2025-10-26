import { AppError } from '../utils/appError';
import { TenantRepository } from '../repositories/tenantRepository';
import { TenantSettings } from '../types/models';

const moduleKeys = ['products', 'groups', 'tasks', 'team'] as const;
type ModuleKey = (typeof moduleKeys)[number];

type ModuleSettings = Record<ModuleKey, boolean>;

const normalizeSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

export class TenantService {
  private tenantRepo: TenantRepository;

  constructor() {
    this.tenantRepo = new TenantRepository();
  }

  async getTenant(tenantId: string) {
    const tenant = await this.tenantRepo.findById(tenantId);

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    return tenant;
  }

  async listTenants() {
    return this.tenantRepo.listAll();
  }

  async updateOnboarding(
    tenantId: string,
    data: {
      name?: string;
      slug?: string;
      logo_url?: string | null;
      country?: string | null;
      city?: string | null;
      industry?: string | null;
      modules?: string[];
    }
  ) {
    const tenant = await this.tenantRepo.findById(tenantId);

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    let normalizedSlug: string | undefined;
    if (data.slug !== undefined) {
      const candidate = normalizeSlug(data.slug);

      if (candidate.length < 3) {
        throw new AppError('Workspace address must contain at least 3 characters', 400);
      }

      if (candidate !== tenant.slug) {
        const existingTenant = await this.tenantRepo.findBySlug(candidate);
        if (existingTenant && existingTenant.id !== tenant.id) {
          throw new AppError('Workspace address is already in use', 409);
        }
        normalizedSlug = candidate;
      }
    }

    const currentSettings = (tenant.settings || {}) as TenantSettings;
    const existingModules = currentSettings.modules;

    const defaultModules: ModuleSettings = existingModules
      ? moduleKeys.reduce((acc, key) => {
          acc[key] = Boolean(existingModules[key]);
          return acc;
        }, {} as ModuleSettings)
      : {
          products: true,
          groups: false,
          tasks: true,
          team: true,
        };

    const modules: ModuleSettings = data.modules
      ? moduleKeys.reduce((acc, key) => {
          acc[key] = data.modules ? data.modules.includes(key) : defaultModules[key];
          return acc;
        }, {} as ModuleSettings)
      : defaultModules;

    const settings: TenantSettings = {
      ...currentSettings,
      modules,
      onboarding: {
        ...(currentSettings.onboarding || {}),
        completed: true,
        completedAt: new Date().toISOString(),
      },
    };

    const updatedTenant = await this.tenantRepo.update(tenantId, {
      name: data.name,
      slug: normalizedSlug,
      logo_url: data.logo_url,
      country: data.country,
      city: data.city,
      industry: data.industry,
      settings,
    });

    return updatedTenant;
  }
}

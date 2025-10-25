import { AppError } from '../utils/appError';
import { TenantRepository } from '../repositories/tenantRepository';
import { TenantSettings } from '../types/models';

const moduleKeys = ['products', 'groups', 'tasks', 'team'] as const;
type ModuleKey = (typeof moduleKeys)[number];

type ModuleSettings = Record<ModuleKey, boolean>;

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
      logo_url: data.logo_url,
      country: data.country,
      city: data.city,
      industry: data.industry,
      settings,
    });

    return updatedTenant;
  }
}

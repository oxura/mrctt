import { AppError } from '../utils/appError';
import { TenantRepository } from '../repositories/tenantRepository';

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
}

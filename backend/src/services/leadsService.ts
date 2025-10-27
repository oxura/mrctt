import leadsRepository, {
  CreateLeadDto,
  LeadsFilter,
  LeadsListResult,
  Lead,
  UpdateLeadDto,
} from '../repositories/leadsRepository';

export class LeadsService {
  async listLeads(tenantId: string, filters: LeadsFilter): Promise<LeadsListResult> {
    return leadsRepository.findAll(tenantId, filters);
  }

  async createLead(
    tenantId: string,
    data: CreateLeadDto,
    userId?: string
  ): Promise<Lead> {
    return leadsRepository.create(tenantId, data, userId);
  }

  async getLead(tenantId: string, leadId: string): Promise<Lead> {
    return leadsRepository.findById(tenantId, leadId);
  }

  async updateLead(
    tenantId: string,
    leadId: string,
    data: UpdateLeadDto,
    userId?: string
  ): Promise<Lead> {
    return leadsRepository.update(tenantId, leadId, data, userId);
  }

  async updateLeadStatus(
    tenantId: string,
    leadId: string,
    status: string,
    userId?: string
  ): Promise<Lead> {
    return leadsRepository.updateStatus(tenantId, leadId, status, userId);
  }

  async deleteLead(tenantId: string, leadId: string, userId?: string): Promise<void> {
    await leadsRepository.delete(tenantId, leadId, userId);
  }
}

export default new LeadsService();

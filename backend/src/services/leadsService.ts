import leadsRepository, {
  CreateLeadDto,
  LeadsFilter,
  LeadsListResult,
  Lead,
  UpdateLeadDto,
} from '../repositories/leadsRepository';
import groupsService from './groupsService';

export class LeadsService {
  async listLeads(tenantId: string, filters: LeadsFilter): Promise<LeadsListResult> {
    return leadsRepository.findAll(tenantId, filters);
  }

  async createLead(
    tenantId: string,
    data: CreateLeadDto,
    userId?: string
  ): Promise<Lead> {
    const lead = await leadsRepository.create(tenantId, data, userId);

    if (lead.group_id) {
      await groupsService.refreshGroupCapacity(tenantId, lead.group_id);
    }

    return lead;
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
    const previousLead = await leadsRepository.findById(tenantId, leadId);
    const lead = await leadsRepository.update(tenantId, leadId, data, userId);

    const groupIdsToRefresh = new Set<string>();

    if (previousLead.group_id) {
      groupIdsToRefresh.add(previousLead.group_id);
    }

    if (lead.group_id) {
      groupIdsToRefresh.add(lead.group_id);
    }

    await Promise.all(
      Array.from(groupIdsToRefresh).map((groupId) =>
        groupsService.refreshGroupCapacity(tenantId, groupId)
      )
    );

    return lead;
  }

  async updateLeadStatus(
    tenantId: string,
    leadId: string,
    status: string,
    userId?: string
  ): Promise<Lead> {
    return leadsRepository.updateStatus(tenantId, leadId, status, userId);
  }

  async batchUpdateStatus(
    tenantId: string,
    leadIds: string[],
    status: string,
    userId?: string
  ): Promise<{ updated: number; failed: number }> {
    return leadsRepository.batchUpdateStatus(tenantId, leadIds, status, userId);
  }

  async deleteLead(tenantId: string, leadId: string, userId?: string): Promise<void> {
    const lead = await leadsRepository.findById(tenantId, leadId);

    await leadsRepository.delete(tenantId, leadId, userId);

    if (lead.group_id) {
      await groupsService.refreshGroupCapacity(tenantId, lead.group_id);
    }
  }
}

export default new LeadsService();

import activitiesRepository, { Activity } from '../repositories/activitiesRepository';
import leadsRepository from '../repositories/leadsRepository';

export class ActivitiesService {
  async getActivitiesByLeadId(tenantId: string, leadId: string): Promise<Activity[]> {
    await leadsRepository.findById(tenantId, leadId);
    return activitiesRepository.findByLeadId(tenantId, leadId);
  }
}

export default new ActivitiesService();

import formsRepository, {
  CreateFormDto,
  UpdateFormDto,
  FormsFilter,
  FormsListResult,
} from '../repositories/formsRepository';
import { Form } from '../types/models';

class FormsService {
  async createForm(tenantId: string, userId: string, data: CreateFormDto): Promise<Form> {
    const form = await formsRepository.create(tenantId, data);
    return form;
  }

  async getForm(tenantId: string, formId: string): Promise<Form> {
    return formsRepository.findById(tenantId, formId);
  }

  async getPublicForm(publicUrl: string): Promise<Form> {
    return formsRepository.findByPublicUrl(publicUrl);
  }

  async listForms(tenantId: string, filters: FormsFilter): Promise<FormsListResult> {
    return formsRepository.findAll(tenantId, filters);
  }

  async updateForm(tenantId: string, formId: string, data: UpdateFormDto): Promise<Form> {
    return formsRepository.update(tenantId, formId, data);
  }

  async deleteForm(tenantId: string, formId: string): Promise<void> {
    await formsRepository.delete(tenantId, formId);
  }

  async regeneratePublicUrl(tenantId: string, formId: string): Promise<Form> {
    return formsRepository.regeneratePublicUrl(tenantId, formId);
  }
}

export default new FormsService();

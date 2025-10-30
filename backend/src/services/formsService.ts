import { PoolClientLike } from '../db/client';
import formsRepository, {
  CreateFormDto,
  UpdateFormDto,
  FormsFilter,
  FormsListResult,
} from '../repositories/formsRepository';
import { Form, FormField } from '../types/models';
import leadsRepository, { CreateLeadDto } from '../repositories/leadsRepository';
import activitiesRepository from '../repositories/activitiesRepository';
import formSubmissionsRepository from '../repositories/formSubmissionsRepository';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';
import { verifyCaptcha } from './captchaService';

export interface SubmitFormDto {
  values: Record<string, any>;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  captcha_token?: string | null;
}

const normalizeLabel = (label: string): string => label.toLowerCase().trim();

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const sanitizeUtmParam = (param: string | null | undefined): string | null => {
  if (!param) return null;
  const trimmed = param.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  return trimmed;
};

class FormsService {
  async createForm(tenantId: string, userId: string, data: CreateFormDto, client?: PoolClientLike): Promise<Form> {
    const form = await formsRepository.create(tenantId, data, client);
    return form;
  }

  async getForm(tenantId: string, formId: string, client?: PoolClientLike): Promise<Form> {
    return formsRepository.findById(tenantId, formId, client);
  }

  async getPublicForm(publicUrl: string, client?: PoolClientLike): Promise<Form> {
    return formsRepository.findByPublicUrl(publicUrl, client);
  }

  async listForms(tenantId: string, filters: FormsFilter, client?: PoolClientLike): Promise<FormsListResult> {
    return formsRepository.findAll(tenantId, filters, client);
  }

  async updateForm(tenantId: string, formId: string, data: UpdateFormDto, client?: PoolClientLike): Promise<Form> {
    return formsRepository.update(tenantId, formId, data, client);
  }

  async deleteForm(tenantId: string, formId: string, client?: PoolClientLike): Promise<void> {
    await formsRepository.delete(tenantId, formId, client);
  }

  async regeneratePublicUrl(tenantId: string, formId: string, client?: PoolClientLike): Promise<Form> {
    return formsRepository.regeneratePublicUrl(tenantId, formId, client);
  }

  async submitPublicForm(
    publicUrl: string,
    data: SubmitFormDto,
    requestId?: string,
    client?: PoolClientLike
  ): Promise<{ success: true; lead_id: string }> {
    const form = await formsRepository.findByPublicUrl(publicUrl, client);

    await verifyCaptcha(data.captcha_token, data.ip_address);

    const fieldErrors: Record<string, string> = {};

    form.fields.forEach((field) => {
      const value = data.values[field.id];
      if (!field.required) {
        return;
      }

      if (field.type === 'checkbox') {
        if (value !== true) {
          fieldErrors[field.id] = `Поле "${field.label}" обязательно для заполнения`;
        }
        return;
      }

      if (isEmptyValue(value)) {
        fieldErrors[field.id] = `Поле "${field.label}" обязательно для заполнения`;
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      logger.warn('Public form submission validation failed', {
        requestId,
        formId: form.id,
        tenantId: form.tenant_id,
        publicUrl,
        fieldErrors,
        ipAddress: data.ip_address,
      });
      throw new AppError('Validation failed', 400, { fields: fieldErrors });
    }

    let firstName: string | null = null;
    let lastName: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let fallbackName: string | null = null;

    const customFields: Record<string, { label: string; type: FormField['type']; value: unknown }> = {};

    form.fields.forEach((field) => {
      const rawValue = data.values[field.id];
      if (rawValue === undefined) {
        return;
      }

      const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
      const normalizedLabel = normalizeLabel(field.label);

      if (isEmptyValue(value)) {
        customFields[field.id] = { label: field.label, type: field.type, value: null };
        return;
      }

      if (field.type === 'email' && typeof value === 'string') {
        email = value;
      } else if (field.type === 'phone' && typeof value === 'string') {
        phone = value;
      } else if (
        field.type === 'text' &&
        typeof value === 'string' &&
        (normalizedLabel.includes('имя') || normalizedLabel.includes('name')) &&
        !normalizedLabel.includes('фамил') &&
        !firstName
      ) {
        firstName = value;
      } else if (
        field.type === 'text' &&
        typeof value === 'string' &&
        (normalizedLabel.includes('фамил') || normalizedLabel.includes('surname') || normalizedLabel.includes('last')) &&
        !lastName
      ) {
        lastName = value;
      } else if (!fallbackName && field.type === 'text' && typeof value === 'string') {
        fallbackName = value;
      }

      customFields[field.id] = { label: field.label, type: field.type, value };
    });

    if (!firstName && fallbackName) {
      firstName = fallbackName;
    }

    const leadData: CreateLeadDto = {
      product_id: form.product_id || null,
      status: 'new',
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      source: 'public_form',
      utm_source: sanitizeUtmParam(data.utm_source),
      utm_medium: sanitizeUtmParam(data.utm_medium),
      utm_campaign: sanitizeUtmParam(data.utm_campaign),
      custom_fields: customFields,
    };

    const lead = await leadsRepository.create(form.tenant_id, leadData, client);

    await formSubmissionsRepository.create(
      {
        tenant_id: form.tenant_id,
        form_id: form.id,
        lead_id: lead.id,
        data: data.values,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null,
      },
      client
    );

    await activitiesRepository.create(
      form.tenant_id,
      lead.id,
      null,
      {
        activity_type: 'lead_created_via_form',
        description: 'Лид создан через форму',
        metadata: {
          form_id: form.id,
          form_name: form.name,
          public_url: publicUrl,
        },
      },
      client
    );

    logger.info('Public form submission successful', {
      requestId,
      formId: form.id,
      leadId: lead.id,
      tenantId: form.tenant_id,
      publicUrl,
      ipAddress: data.ip_address,
    });

    return { success: true, lead_id: lead.id };
  }
}

export default new FormsService();

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

export interface SubmitFormDto {
  values: Record<string, any>;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

const normalizeLabel = (label: string): string => label.toLowerCase().trim();

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

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

  async submitPublicForm(
    publicUrl: string,
    data: SubmitFormDto,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<{ success: true; lead_id: string }> {
    const form = await formsRepository.findByPublicUrl(publicUrl);

    const valuesPayloadSize = Buffer.byteLength(JSON.stringify(data.values ?? {}), 'utf8');
    const MAX_VALUES_PAYLOAD_SIZE = 32 * 1024;

    if (valuesPayloadSize > MAX_VALUES_PAYLOAD_SIZE) {
      logger.warn('Form submission values payload too large', {
        publicUrl,
        tenantId: form.tenant_id,
        valuesPayloadSize,
      });
      throw new AppError('Form payload too large', 400);
    }

    const fieldErrors: Record<string, string> = {};

    const MAX_FIELD_SIZE = 5000;
    const MAX_TOTAL_FIELDS = 50;

    if (Object.keys(data.values).length > MAX_TOTAL_FIELDS) {
      throw new AppError('Too many fields submitted', 400);
    }

    const allowedFieldIds = new Set(form.fields.map((field) => field.id));
    Object.keys(data.values).forEach((key) => {
      if (!allowedFieldIds.has(key)) {
        delete data.values[key];
      }
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    form.fields.forEach((field) => {
      const rawValue = data.values[field.id];

      if (field.type === 'checkbox') {
        let coercedValue = rawValue;

        if (typeof coercedValue === 'string') {
          const normalized = coercedValue.trim().toLowerCase();
          if (normalized === 'true') {
            coercedValue = true;
          } else if (normalized === 'false' || normalized === '') {
            coercedValue = false;
          }
        }

        if (coercedValue === undefined || coercedValue === null) {
          coercedValue = false;
        }

        if (typeof coercedValue !== 'boolean') {
          fieldErrors[field.id] = `Поле "${field.label}" должно быть булевым значением`;
          return;
        }

        data.values[field.id] = coercedValue;

        if (field.required && coercedValue !== true) {
          fieldErrors[field.id] = `Поле "${field.label}" обязательно для заполнения`;
        }

        return;
      }

      let value = rawValue;

      if (Array.isArray(value)) {
        value = value
          .map((item) => (typeof item === 'string' ? item.trim() : item))
          .filter((item) => !isEmptyValue(item));
      } else if (typeof value === 'string') {
        value = value.trim();
      }

      if (field.required && isEmptyValue(value)) {
        fieldErrors[field.id] = `Поле "${field.label}" обязательно для заполнения`;
        return;
      }

      if (isEmptyValue(value)) {
        data.values[field.id] = value ?? null;
        return;
      }

      if (typeof value === 'string' && value.length > MAX_FIELD_SIZE) {
        fieldErrors[field.id] = `Поле "${field.label}" не может превышать ${MAX_FIELD_SIZE} символов`;
        return;
      }

      if (Array.isArray(value)) {
        data.values[field.id] = value;
        return;
      }

      switch (field.type) {
        case 'email':
          if (typeof value !== 'string' || !emailRegex.test(value)) {
            fieldErrors[field.id] = `Поле "${field.label}" должно содержать корректный email адрес`;
            return;
          }
          data.values[field.id] = value.toLowerCase();
          break;
        case 'phone':
          if (typeof value !== 'string' || !phoneRegex.test(value)) {
            fieldErrors[field.id] = `Поле "${field.label}" должно содержать корректный номер телефона`;
            return;
          }
          data.values[field.id] = value;
          break;
        case 'dropdown':
          if (typeof value !== 'string') {
            fieldErrors[field.id] = `Поле "${field.label}" должно содержать корректное значение`;
            return;
          }

          if (value !== '' && field.options && !field.options.includes(value)) {
            fieldErrors[field.id] = `Поле "${field.label}" содержит недопустимое значение`;
            return;
          }

          data.values[field.id] = value;
          break;
        case 'date':
          if (typeof value !== 'string' || !dateRegex.test(value)) {
            fieldErrors[field.id] = `Поле "${field.label}" должно содержать дату в формате YYYY-MM-DD`;
            return;
          }
          data.values[field.id] = value;
          break;
        default:
          if (typeof value === 'string') {
            data.values[field.id] = value;
          } else {
            data.values[field.id] = value ?? null;
          }
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      logger.warn('Form validation failed', {
        publicUrl,
        ipAddress,
        fieldErrors,
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

    const customFieldsSize = Buffer.byteLength(JSON.stringify(customFields), 'utf8');
    const MAX_CUSTOM_FIELDS_SIZE = 20 * 1024;

    if (customFieldsSize > MAX_CUSTOM_FIELDS_SIZE) {
      logger.warn('Custom fields payload too large', {
        publicUrl,
        tenantId: form.tenant_id,
        customFieldsSize,
      });
      throw new AppError('Form payload too large', 400);
    }

    const leadData: CreateLeadDto = {
      product_id: form.product_id || null,
      status: 'new',
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      source: 'public_form',
      utm_source: data.utm_source?.trim() || null,
      utm_medium: data.utm_medium?.trim() || null,
      utm_campaign: data.utm_campaign?.trim() || null,
      custom_fields: customFields,
    };

    const lead = await leadsRepository.create(form.tenant_id, leadData);

    await Promise.all([
      formSubmissionsRepository.create(form.tenant_id, {
        form_id: form.id,
        lead_id: lead.id,
        data: data.values,
        ip_address: ipAddress,
        user_agent: userAgent,
      }),
      activitiesRepository.create(form.tenant_id, lead.id, null, {
        activity_type: 'lead_created_via_form',
        description: 'Лид создан через форму',
        metadata: {
          form_id: form.id,
          form_name: form.name,
          public_url: publicUrl,
          utm_source: data.utm_source || null,
          utm_medium: data.utm_medium || null,
          utm_campaign: data.utm_campaign || null,
        },
      }),
    ]);

    logger.info('Form submitted successfully', {
      tenantId: form.tenant_id,
      formId: form.id,
      leadId: lead.id,
      ipAddress,
      source: 'public_form',
    });

    return { success: true, lead_id: lead.id };
  }
}


export default new FormsService();

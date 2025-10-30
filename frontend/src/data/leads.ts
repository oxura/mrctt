import type { TenantLeadStatus } from '../types';

export interface LeadStatusConfig extends TenantLeadStatus {
  description?: string;
}

export const defaultLeadStatuses: LeadStatusConfig[] = [
  { key: 'new', label: 'Новый', color: '#38bdf8', order: 0, description: 'Связаться в течение 1 часа' },
  { key: 'contacted', label: 'Связались', color: '#8b5cf6', order: 1, description: 'Идет первичный контакт' },
  { key: 'qualified', label: 'Квалифицирован', color: '#6366f1', order: 2, description: 'Лид соответствует критериям' },
  { key: 'proposal_sent', label: 'Отправлено КП', color: '#f97316', order: 3, description: 'Ждем ответ по коммерческому предложению' },
  { key: 'negotiation', label: 'Переговоры', color: '#eab308', order: 4, description: 'Обсуждение условий сделки' },
  { key: 'won', label: 'Успех', color: '#22c55e', order: 5, description: 'Сделка закрыта успешно' },
  { key: 'lost', label: 'Отказ', color: '#ef4444', order: 6, description: 'Сделка не состоялась' },
  { key: 'on_hold', label: 'Отложено', color: '#64748b', order: 7, description: 'Решение отложено' },
];

const DEFAULT_COLOR = '#6366f1';

export const normalizeLeadStatuses = (statuses?: TenantLeadStatus[] | null): LeadStatusConfig[] => {
  if (!statuses || statuses.length === 0) {
    return defaultLeadStatuses.map((status) => ({ ...status }));
  }

  const sanitized = statuses
    .map((status, index) => {
      const base = defaultLeadStatuses.find((item) => item.key === status.key);
      const colorPattern = /^#[0-9A-Fa-f]{6}$/;

      return {
        ...status,
        order: typeof status.order === 'number' ? status.order : index,
        color: colorPattern.test(status.color) ? status.color : base?.color ?? DEFAULT_COLOR,
        description: base?.description,
      } satisfies LeadStatusConfig;
    })
    .sort((a, b) => a.order - b.order);

  return sanitized;
};

export const buildLeadStatusMeta = (statuses: LeadStatusConfig[]) => {
  return statuses.reduce<Record<string, { label: string; accent: string; description?: string }>>(
    (acc, status) => {
      acc[status.key] = {
        label: status.label,
        accent: status.color,
        description: status.description,
      };
      return acc;
    },
    {}
  );
};

export const leadsMock = [];

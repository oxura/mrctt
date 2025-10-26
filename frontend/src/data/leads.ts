export type LeadStatus = 'new' | 'working' | 'awaiting_payment' | 'won' | 'lost';

export interface LeadRecord {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  status: LeadStatus;
  product: string;
  manager: string;
  createdAt: string;
  source: string;
  utmSource?: string;
  utmCampaign?: string;
  value?: number;
  appointmentDate?: string;
  cohortName?: string;
}

export const leadStatusMeta: Record<LeadStatus, { label: string; description: string; accent: string } > = {
  new: { label: 'Новый', description: 'Связаться в течение 1 часа', accent: '#38bdf8' },
  working: { label: 'В работе', description: 'Идет коммуникация', accent: '#6366f1' },
  awaiting_payment: { label: 'Ждет оплаты', description: 'Отправлен счет', accent: '#f97316' },
  won: { label: 'Успех', description: 'Сделка закрыта', accent: '#22c55e' },
  lost: { label: 'Отказ', description: 'Причину уточнить', accent: '#ef4444' },
};

export const leadsMock: LeadRecord[] = [
  {
    id: 'L-101',
    name: 'Иван Петров',
    phone: '+7 (901) 123-45-67',
    email: 'ivan.petrov@example.com',
    status: 'new',
    product: 'Курс «UX дизайн 2.0»',
    manager: 'Анна Кузнецова',
    createdAt: '2024-10-24T09:30:00Z',
    source: 'Landing',
    utmSource: 'facebook',
    utmCampaign: 'ux-bootcamp',
    value: 28000,
    cohortName: 'Поток ноябрь 2024',
  },
  {
    id: 'L-102',
    name: 'Мария Сидорова',
    phone: '+7 (921) 555-01-02',
    email: 'maria.sid@clinic.ru',
    status: 'working',
    product: 'Консультация гинеколога',
    manager: 'Олег Пастухов',
    createdAt: '2024-10-23T12:10:00Z',
    source: 'Widget',
    utmSource: 'instagram',
    utmCampaign: 'clinic-autumn',
    appointmentDate: '2024-10-28T12:00:00Z',
    value: 4500,
  },
  {
    id: 'L-103',
    name: 'ООО «Путешествуем вместе»',
    phone: '+7 (495) 765-43-21',
    email: 'travel@b2b-travel.ru',
    status: 'awaiting_payment',
    product: 'Корпоративный тур в Грузию',
    manager: 'Екатерина Иванова',
    createdAt: '2024-10-20T08:45:00Z',
    source: 'Referral',
    utmSource: 'partner',
    value: 320000,
  },
  {
    id: 'L-104',
    name: 'ИП Алексеев',
    phone: '+7 (903) 234-56-78',
    email: 'info@alekseev.pro',
    status: 'won',
    product: 'CRM внедрение',
    manager: 'Анна Кузнецова',
    createdAt: '2024-10-18T10:20:00Z',
    source: 'LinkedIn',
    utmSource: 'outbound',
    utmCampaign: 'crm-upgrade',
    value: 78000,
  },
  {
    id: 'L-105',
    name: 'Елена Смирнова',
    phone: '+7 (911) 349-67-80',
    email: 'elena@beauty-lab.ru',
    status: 'working',
    product: 'Онлайн-курс «Digital Beauty»',
    manager: 'Олег Пастухов',
    createdAt: '2024-10-22T15:50:00Z',
    source: 'Instagram Direct',
    utmSource: 'direct',
    utmCampaign: 'beauty-funnel',
    value: 19000,
    cohortName: 'Поток декабрь 2024',
  },
  {
    id: 'L-106',
    name: 'Степан Белов',
    phone: '+7 (905) 111-44-99',
    email: 'stepan.belov@gmail.com',
    status: 'new',
    product: 'Наставничество по продажам',
    manager: 'Менеджер-бот',
    createdAt: '2024-10-25T17:05:00Z',
    source: 'Telegram',
    utmSource: 'tg-channel',
    value: 15000,
  },
  {
    id: 'L-107',
    name: 'ООО «Медикал Гид»',
    phone: '+7 (812) 255-77-88',
    email: 'contact@medicalguide.ru',
    status: 'lost',
    product: 'Медицинская CRM лицензия',
    manager: 'Екатерина Иванова',
    createdAt: '2024-10-10T11:00:00Z',
    source: 'Conference',
    utmSource: 'offline',
    value: 54000,
  },
  {
    id: 'L-108',
    name: 'Алина Круглова',
    phone: '+7 (980) 700-55-22',
    email: 'alina.kruglova@mail.ru',
    status: 'awaiting_payment',
    product: 'Тур «Новый год в Стамбуле»',
    manager: 'Антон Любимов',
    createdAt: '2024-10-21T09:15:00Z',
    source: 'Landing',
    utmSource: 'google-ads',
    utmCampaign: 'travel-stambul',
    value: 69000,
  },
  {
    id: 'L-109',
    name: 'ООО «EdTech Labs»',
    phone: '+7 (495) 345-88-00',
    email: 'hello@edtechlabs.io',
    status: 'working',
    product: 'Франшиза курса по Data Science',
    manager: 'Анна Кузнецова',
    createdAt: '2024-10-19T13:40:00Z',
    source: 'Email маркетинг',
    utmSource: 'newsletter',
    value: 420000,
  },
  {
    id: 'L-110',
    name: 'Сергей Лисицын',
    phone: '+7 (903) 222-77-33',
    email: 'sergey.lisitsyn@pm.me',
    status: 'new',
    product: 'Курс «Motion design»',
    manager: 'Антон Любимов',
    createdAt: '2024-10-25T08:05:00Z',
    source: 'TikTok',
    utmSource: 'tiktok-ads',
    value: 26000,
  },
];

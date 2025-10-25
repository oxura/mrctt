import { ActivityItem, BillingPlan, Company, FormField, Lead, LeadForm, LeadStatus, ModuleToggle, PaymentRecord, Product, SuperAdminStats, Task, User, GroupFlow } from '../types';
import { nanoid } from '../utils/nanoid';

export const baseLeadStatuses: LeadStatus[] = [
  { id: 'status-new', name: 'Новый', order: 1, color: '#2563eb', type: 'new' },
  { id: 'status-inwork', name: 'В работе', order: 2, color: '#6366f1', type: 'inwork' },
  { id: 'status-waiting', name: 'Ждет оплаты', order: 3, color: '#f59e0b', type: 'waiting' },
  { id: 'status-success', name: 'Успех', order: 4, color: '#10b981', type: 'success' },
  { id: 'status-failed', name: 'Отказ', order: 5, color: '#ef4444', type: 'failed' },
];

export const defaultModules: ModuleToggle[] = [
  { key: 'dashboard', label: 'Главная', enabled: true },
  { key: 'analytics', label: 'Аналитика', enabled: true },
  { key: 'leads', label: 'Лиды', enabled: true },
  { key: 'kanban', label: 'Канбан', enabled: true },
  { key: 'products', label: 'Продукты', enabled: true },
  { key: 'groups', label: 'Группы', enabled: false },
  { key: 'calendar', label: 'Календарь', enabled: true },
  { key: 'team', label: 'Команда', enabled: true },
  { key: 'forms', label: 'Анкеты', enabled: true },
  { key: 'settings', label: 'Настройки', enabled: true },
  { key: 'billing', label: 'Биллинг', enabled: true },
];

export const mockCompany = (overrides?: Partial<Company>): Company => ({
  id: 'company-demo',
  name: 'Экосистема заявок',
  country: 'Россия',
  city: 'Москва',
  niche: 'Онлайн-школа/Курсы',
  modules: defaultModules.map((mod) => ({ ...mod, description: '' })),
  leadStatuses: baseLeadStatuses,
  ...overrides,
});

export const mockUser = (overrides?: Partial<User>): User => ({
  id: 'user-owner',
  name: 'Алексей Иванов',
  email: 'owner@example.com',
  role: 'owner',
  onboardingCompleted: true,
  companyId: 'company-demo',
  ...overrides,
});

export const mockProducts: Product[] = [
  {
    id: 'prod-ux-course',
    name: 'Курс по UX/UI дизайну',
    description: '8-недельная программа обучения дизайну',
    type: 'course',
    price: 45000,
    status: 'active',
    companyId: 'company-demo',
  },
  {
    id: 'prod-branding',
    name: 'Разработка фирменного стиля',
    description: 'Комплекс услуг по брендингу',
    type: 'service',
    price: 90000,
    status: 'active',
    companyId: 'company-demo',
  },
];

export const mockGroups: GroupFlow[] = [
  {
    id: 'group-september',
    productId: 'prod-ux-course',
    name: 'Сентябрьский поток',
    startDate: new Date().toISOString(),
    capacity: 20,
    enrolled: 15,
    status: 'open',
  },
  {
    id: 'group-october',
    productId: 'prod-ux-course',
    name: 'Октябрьский поток',
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    capacity: 20,
    enrolled: 20,
    status: 'closed',
  },
];

export const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    name: 'Анна Смирнова',
    phone: '+79990001122',
    email: 'anna@example.com',
    productId: 'prod-ux-course',
    groupId: 'group-september',
    statusId: 'status-inwork',
    kanbanOrder: 0,
    ownerId: 'user-manager-1',
    createdAt: new Date().toISOString(),
    source: 'instagram',
    notes: ['Интересуется рассрочкой'],
    companyId: 'company-demo',
    history: [
      {
        id: nanoid(),
        type: 'creation',
        message: 'Лид создан через анкету',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      },
      {
        id: nanoid(),
        type: 'status_change',
        message: 'Статус изменен на "В работе"',
        createdAt: new Date().toISOString(),
        createdBy: 'user-manager-1',
      },
    ],
    appointmentDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'lead-002',
    name: 'Иван Петров',
    phone: '+79991234567',
    email: 'ivan@example.com',
    productId: 'prod-branding',
    statusId: 'status-new',
    kanbanOrder: 0,
    ownerId: 'user-owner',
    createdAt: new Date().toISOString(),
    source: 'website',
    notes: [],
    companyId: 'company-demo',
    history: [
      {
        id: nanoid(),
        type: 'creation',
        message: 'Лид создан вручную',
        createdAt: new Date().toISOString(),
        createdBy: 'user-owner',
      },
    ],
  },
  {
    id: 'lead-003',
    name: 'Мария Васильева',
    phone: '+79995551122',
    email: 'maria@example.com',
    productId: 'prod-ux-course',
    groupId: 'group-september',
    statusId: 'status-waiting',
    kanbanOrder: 0,
    ownerId: 'user-manager-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    source: 'facebook',
    notes: ['Требуется инвойс для компании'],
    companyId: 'company-demo',
    history: [
      {
        id: nanoid(),
        type: 'creation',
        message: 'Лид создан через анкету',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        createdBy: 'system',
      },
    ],
  },
  {
    id: 'lead-004',
    name: 'Дмитрий Козлов',
    phone: '+79996667788',
    email: 'dmitry@example.com',
    productId: 'prod-ux-course',
    statusId: 'status-success',
    kanbanOrder: 0,
    ownerId: 'user-manager-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    source: 'referral',
    notes: ['Оплатил полностью', 'Очень мотивирован'],
    companyId: 'company-demo',
    history: [
      {
        id: nanoid(),
        type: 'creation',
        message: 'Лид создан вручную',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        createdBy: 'user-manager-1',
      },
      {
        id: nanoid(),
        type: 'status_change',
        message: 'Статус изменен на "Успех"',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        createdBy: 'user-manager-1',
      },
    ],
  },
  {
    id: 'lead-005',
    name: 'Елена Соколова',
    phone: '+79993334455',
    statusId: 'status-failed',
    kanbanOrder: 0,
    ownerId: 'user-owner',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    source: 'cold_call',
    notes: ['Не готова начать обучение сейчас', 'Попробовать связаться через 3 месяца'],
    companyId: 'company-demo',
    history: [
      {
        id: nanoid(),
        type: 'creation',
        message: 'Лид создан вручную',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        createdBy: 'user-owner',
      },
    ],
  },
  {
    id: 'lead-006',
    name: 'Алексей Морозов',
    phone: '+79998887766',
    email: 'alexey@example.com',
    productId: 'prod-branding',
    statusId: 'status-inwork',
    kanbanOrder: 1,
    ownerId: 'user-admin-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    source: 'google',
    notes: ['Запросил портфолио'],
    companyId: 'company-demo',
    history: [
      {
        id: nanoid(),
        type: 'creation',
        message: 'Лид создан через анкету',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        createdBy: 'system',
      },
    ],
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Перезвонить Анне',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    leadId: 'lead-001',
    ownerId: 'user-manager-1',
    status: 'pending',
  },
  {
    id: 'task-002',
    title: 'Отправить коммерческое предложение Ивану',
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    leadId: 'lead-002',
    ownerId: 'user-owner',
    status: 'overdue',
  },
];

export const mockActivities: ActivityItem[] = [
  {
    id: nanoid(),
    message: 'Менеджер Анна сменила статус лида "Анна Смирнова" на "В работе"',
    createdAt: new Date().toISOString(),
  },
  {
    id: nanoid(),
    message: 'Новая заявка с сайта: Иван Петров',
    createdAt: new Date().toISOString(),
  },
];

const baseFields: FormField[] = [
  { id: 'field-name', type: 'text', label: 'Имя', required: true },
  { id: 'field-phone', type: 'phone', label: 'Телефон', required: true },
  { id: 'field-email', type: 'email', label: 'Email', required: false },
];

export const mockForms: LeadForm[] = [
  {
    id: 'form-001',
    name: 'Анкета UX/UI курса',
    productId: 'prod-ux-course',
    thankYouMessage: 'Спасибо! Мы свяжемся с вами в течение 15 минут.',
    fields: baseFields,
    publicUrl: 'https://forms.ecosystem-crm.app/form-001',
  },
];

export const mockBillingPlans: BillingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    pricePerMonth: 2900,
    description: 'Для индивидуальных предпринимателей',
    features: [
      '1 рабочее место',
      'Онбординг мастер',
      'Формы захвата лидов',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    pricePerMonth: 5900,
    description: 'Для команд до 10 человек',
    features: [
      'До 10 пользователей',
      'Канбан воронка',
      'Календарь и задачи',
      'Расширенная аналитика',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    pricePerMonth: 12900,
    description: 'Для растущих компаний',
    features: [
      'Неограниченные пользователи',
      'Свободное управление модулями',
      'Имперсонация для владельца платформы',
    ],
  },
];

export const mockPayments: PaymentRecord[] = [
  {
    id: 'pay-001',
    date: new Date().toISOString(),
    amount: 5900,
    status: 'paid',
    invoiceUrl: '#',
  },
  {
    id: 'pay-002',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    amount: 5900,
    status: 'paid',
    invoiceUrl: '#',
  },
];

export const mockSuperAdminStats: SuperAdminStats = {
  totalCompanies: 124,
  activeSubscriptions: 82,
  mrr: 485000,
  recentCompanies: [
    { id: nanoid(), name: 'Digital Clinic', createdAt: new Date().toISOString(), niche: 'Медицина' },
    { id: nanoid(), name: 'SkyTravel', createdAt: new Date().toISOString(), niche: 'Туризм' },
    { id: nanoid(), name: 'SkillBoost Academy', createdAt: new Date().toISOString(), niche: 'Курсы' },
  ],
};

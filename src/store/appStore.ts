import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ActivityItem, BillingPlan, Company, Lead, LeadForm, LeadStatus, ModuleToggle, PaymentRecord, Product, Role, Task, User, GroupFlow } from '../types';
import {
  mockActivities,
  mockBillingPlans,
  mockCompany,
  mockForms,
  mockGroups,
  mockLeads,
  mockPayments,
  mockProducts,
  mockSuperAdminStats,
  mockTasks,
  mockUser,
  defaultModules,
} from '../data/mockData';
import { nanoid } from '../utils/nanoid';

export type ViewMode = 'table' | 'kanban';
export type NichePreset = 'Онлайн-школа/Курсы' | 'Услуги/Freelance' | 'Медицина/Клиника' | 'Туризм' | 'Другое';

export interface AppState {
  company: Company | null;
  user: User | null;
  team: User[];
  products: Product[];
  groups: GroupFlow[];
  leads: Lead[];
  activities: ActivityItem[];
  tasks: Task[];
  forms: LeadForm[];
  billing: {
    plans: BillingPlan[];
    payments: PaymentRecord[];
    currentPlanId: string;
  };
  superAdminStats: typeof mockSuperAdminStats;
  viewMode: ViewMode;
  moduleToggles: ModuleToggle[];
  mrrTrend: { date: string; value: number }[];
  kpi: {
    newLeads: { value: number; delta: number };
    inProgress: number;
    sales: number;
    overdueTasks: number;
  };
  onboarding: {
    companyName: string;
    city: string;
    country: string;
    logoUrl?: string;
    preset?: NichePreset;
    modules: ModuleToggle[];
    completed: boolean;
  };
  setCompany: (company: Company) => void;
  setUser: (user: User) => void;
  addTeamMember: (member: User) => void;
  updateTeamMember: (userId: string, updates: Partial<User>) => void;
  completeOnboarding: (company: Company, user: User) => void;
  setPreset: (preset: NichePreset) => void;
  toggleModule: (key: ModuleToggle['key'], enabled: boolean) => void;
  addLead: (lead: Lead) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  addLeadHistory: (leadId: string, history: Lead['history'][number]) => void;
  addNoteToLead: (leadId: string, note: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  addGroup: (group: GroupFlow) => void;
  updateGroup: (groupId: string, updates: Partial<GroupFlow>) => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  completeTask: (taskId: string) => void;
  addForm: (form: LeadForm) => void;
  updateForm: (formId: string, updates: Partial<LeadForm>) => void;
  updateLeadStatuses: (statuses: LeadStatus[]) => void;
  setViewMode: (mode: ViewMode) => void;
  refreshKpi: () => void;
}

const presetModuleOverrides: Record<NichePreset, Partial<Record<ModuleToggle['key'], boolean>>> = {
  'Онлайн-школа/Курсы': {
    products: true,
    groups: true,
    calendar: true,
  },
  'Услуги/Freelance': {
    products: true,
    groups: false,
    team: false,
  },
  'Медицина/Клиника': {
    products: true,
    groups: false,
    calendar: true,
  },
  'Туризм': {
    products: true,
    groups: true,
    calendar: true,
  },
  'Другое': {},
};

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    company: mockCompany(),
    user: mockUser(),
    team: [
      mockUser(),
      {
        id: 'user-manager-1',
        name: 'Анна Кузнецова',
        email: 'anna@ecosystem.app',
        role: 'manager',
        onboardingCompleted: true,
        companyId: 'company-demo',
      },
      {
        id: 'user-admin-1',
        name: 'Сергей Волков',
        email: 'sergey@ecosystem.app',
        role: 'admin',
        onboardingCompleted: true,
        companyId: 'company-demo',
      },
    ],
    products: mockProducts,
    groups: mockGroups,
    leads: mockLeads,
    activities: mockActivities,
    tasks: mockTasks,
    forms: mockForms,
    billing: {
      plans: mockBillingPlans,
      payments: mockPayments,
      currentPlanId: 'pro',
    },
    superAdminStats: mockSuperAdminStats,
    viewMode: 'table',
    moduleToggles: defaultModules.map((mod) => ({
      ...mod,
      description: mod.key === 'groups'
        ? 'Группы/Потоки для образовательных программ'
        : undefined,
    })),
    mrrTrend: Array.from({ length: 12 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - index));
      return {
        date: date.toISOString(),
        value: 350000 + index * 12000,
      };
    }),
    kpi: {
      newLeads: { value: 5, delta: 12 },
      inProgress: 14,
      sales: 340000,
      overdueTasks: 2,
    },
    onboarding: {
      companyName: '',
      city: '',
      country: '',
      modules: defaultModules.map((mod) => ({ ...mod })),
      completed: false,
    },
    setCompany: (company) => set({ company }),
    setUser: (user) => set({ user }),
    addTeamMember: (member) =>
      set((state) => {
        state.team.push(member);
      }),
    updateTeamMember: (userId, updates) =>
      set((state) => {
        state.team = state.team.map((member) =>
          member.id === userId ? { ...member, ...updates } : member
        );
      }),
    completeOnboarding: (company, user) =>
      set((state) => {
        state.company = company;
        state.user = user;
        state.onboarding.completed = true;
      }),
    setPreset: (preset) =>
      set((state) => {
        const overrides = presetModuleOverrides[preset];
        state.onboarding.preset = preset;
        state.onboarding.modules = state.onboarding.modules.map((module) => ({
          ...module,
          enabled: overrides[module.key] ?? module.enabled,
        }));
      }),
    toggleModule: (key, enabled) =>
      set((state) => {
        state.onboarding.modules = state.onboarding.modules.map((module) =>
          module.key === key ? { ...module, enabled } : module
        );
        if (state.company) {
          state.company.modules = state.company.modules.map((module) =>
            module.key === key ? { ...module, enabled } : module
          );
        }
      }),
    addLead: (lead) =>
      set((state) => {
        state.leads.push(lead);
        state.kpi.newLeads.value += 1;
        state.activities.unshift({
          id: nanoid(),
          message: `Создан новый лид: ${lead.name}`,
          createdAt: new Date().toISOString(),
        });
      }),
    updateLead: (leadId, updates) =>
      set((state) => {
        state.leads = state.leads.map((lead) =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        );
      }),
    addLeadHistory: (leadId, history) =>
      set((state) => {
        const lead = state.leads.find((item) => item.id === leadId);
        if (lead) {
          lead.history.unshift(history);
        }
      }),
    addNoteToLead: (leadId, note) =>
      set((state) => {
        const lead = state.leads.find((item) => item.id === leadId);
        if (lead) {
          lead.notes.push(note);
          lead.history.unshift({
            id: nanoid(),
            type: 'comment',
            message: note,
            createdAt: new Date().toISOString(),
            createdBy: get().user?.id ?? 'system',
          });
        }
      }),
    addProduct: (product) =>
      set((state) => {
        state.products.push(product);
      }),
    updateProduct: (productId, updates) =>
      set((state) => {
        state.products = state.products.map((product) =>
          product.id === productId ? { ...product, ...updates } : product
        );
      }),
    addGroup: (group) =>
      set((state) => {
        state.groups.push(group);
      }),
    updateGroup: (groupId, updates) =>
      set((state) => {
        state.groups = state.groups.map((group) =>
          group.id === groupId ? { ...group, ...updates } : group
        );
      }),
    addTask: (task) =>
      set((state) => {
        state.tasks.push(task);
      }),
    updateTaskStatus: (taskId, status) =>
      set((state) => {
        const task = state.tasks.find((item) => item.id === taskId);
        if (task) {
          task.status = status;
        }
      }),
    completeTask: (taskId) => get().updateTaskStatus(taskId, 'completed'),
    addForm: (form) =>
      set((state) => {
        state.forms.push(form);
      }),
    updateForm: (formId, updates) =>
      set((state) => {
        state.forms = state.forms.map((form) =>
          form.id === formId ? { ...form, ...updates } : form
        );
      }),
    updateLeadStatuses: (statuses) =>
      set((state) => {
        if (state.company) {
          state.company.leadStatuses = [...statuses];
        }
      }),
    setViewMode: (mode) => set({ viewMode: mode }),
    refreshKpi: () =>
      set((state) => {
        const inProgress = state.leads.filter(
          (lead) => lead.statusId === 'status-inwork'
        ).length;
        const overdueTasks = state.tasks.filter(
          (task) => task.status === 'overdue'
        ).length;
        state.kpi.inProgress = inProgress;
        state.kpi.overdueTasks = overdueTasks;
      }),
  }))
);

export const roleLabels: Record<Role, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  manager: 'Менеджер',
  superadmin: 'Суперадмин',
};

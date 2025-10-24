export type Role = 'owner' | 'admin' | 'manager' | 'superadmin';

export type ModuleKey =
  | 'dashboard'
  | 'leads'
  | 'kanban'
  | 'products'
  | 'groups'
  | 'calendar'
  | 'team'
  | 'forms'
  | 'settings'
  | 'billing';

export interface ModuleToggle {
  key: ModuleKey;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  niche: string;
  modules: ModuleToggle[];
  leadStatuses: LeadStatus[];
}

export interface LeadStatus {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  type: 'course' | 'service' | 'medical' | 'travel' | 'other';
  price: number;
  status: 'active' | 'archived';
  companyId: string;
}

export interface GroupFlow {
  id: string;
  productId: string;
  name: string;
  startDate: string;
  capacity: number;
  enrolled: number;
  status: 'open' | 'closed';
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  productId?: string;
  groupId?: string;
  statusId: string;
  ownerId?: string;
  createdAt: string;
  source?: string;
  notes: string[];
  companyId: string;
  history: LeadInteraction[];
  appointmentDate?: string;
}

export interface LeadInteraction {
  id: string;
  type: 'status_change' | 'comment' | 'task' | 'creation';
  message: string;
  createdAt: string;
  createdBy: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  leadId?: string;
  ownerId: string;
  status: 'pending' | 'completed' | 'overdue';
}

export interface ActivityItem {
  id: string;
  message: string;
  createdAt: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'phone' | 'email' | 'select' | 'checkbox' | 'date';
  label: string;
  required: boolean;
  options?: string[];
}

export interface LeadForm {
  id: string;
  name: string;
  productId?: string;
  thankYouMessage: string;
  fields: FormField[];
  publicUrl: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  pricePerMonth: number;
  description: string;
  features: string[];
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

export interface SuperAdminStats {
  totalCompanies: number;
  activeSubscriptions: number;
  mrr: number;
  recentCompanies: Array<{ id: string; name: string; createdAt: string; niche: string }>;
}

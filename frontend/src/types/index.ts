export type UserRole = 'owner' | 'admin' | 'manager' | 'platform_owner';

export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string | null;
  google_calendar_link?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantSettingsModules {
  products?: boolean;
  groups?: boolean;
  tasks?: boolean;
  team?: boolean;
}

export interface TenantSettingsOnboarding {
  completed?: boolean;
  completedAt?: string;
}

export interface TenantLeadStatus {
  key: string;
  label: string;
  color: string;
  order: number;
}

export interface TenantSettings {
  modules?: TenantSettingsModules;
  onboarding?: TenantSettingsOnboarding;
  lead_statuses?: TenantLeadStatus[];
  [key: string]: unknown;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  country?: string | null;
  city?: string | null;
  industry?: string | null;
  timezone: string;
  currency: string;
  settings: TenantSettings;
  is_active: boolean;
  subscription_status: string;
  subscription_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductType = 'course' | 'service' | 'other';
export type ProductStatus = 'active' | 'archived';

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  type: ProductType;
  price?: string | null;
  currency: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export type GroupStatus = 'open' | 'full' | 'closed' | 'cancelled';

export interface Group {
  id: string;
  tenant_id: string;
  product_id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  max_capacity?: number | null;
  current_capacity: number;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
  product_name?: string | null;
}

export type BillingPeriod = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  currency: string;
  billing_period: BillingPeriod;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  tenant_id: string;
  subscription_id?: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  payment_method?: string | null;
  transaction_id?: string | null;
  invoice_url?: string | null;
  description?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

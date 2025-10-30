export type UserRole = 'owner' | 'admin' | 'manager' | 'platform_owner';

export interface TenantSettingsModules {
  products?: boolean;
  groups?: boolean;
  tasks?: boolean;
  team?: boolean;
  [key: string]: boolean | undefined;
}

export interface TenantSettingsOnboarding {
  completed?: boolean;
  completedAt?: string;
  [key: string]: unknown;
}

export interface TenantLeadStatusSetting {
  key: string;
  label: string;
  color: string;
  order: number;
}

export interface TenantSettings extends Record<string, unknown> {
  modules?: TenantSettingsModules;
  onboarding?: TenantSettingsOnboarding;
  lead_statuses?: TenantLeadStatusSetting[];
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

export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  password_hash: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
  token_version: number;
  last_login_at?: string | null;
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
  settings: Record<string, unknown>;
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

export type FormFieldType = 'text' | 'phone' | 'email' | 'dropdown' | 'checkbox' | 'date';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface Form {
  id: string;
  tenant_id: string;
  product_id?: string | null;
  name: string;
  slug: string;
  fields: FormField[];
  success_message?: string | null;
  public_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

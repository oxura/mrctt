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

export interface TenantSettings {
  modules?: TenantSettingsModules;
  onboarding?: TenantSettingsOnboarding;
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

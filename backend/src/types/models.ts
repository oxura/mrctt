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

export interface TenantSettings extends Record<string, unknown> {
  modules?: TenantSettingsModules;
  onboarding?: TenantSettingsOnboarding;
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
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

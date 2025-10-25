import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tenant, User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  setAuth: (payload: { token: string; user: User; tenant: Tenant }) => void;
  updateTenant: (tenant: Tenant) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      isAuthenticated: false,
      setAuth: ({ token, user, tenant }) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('tenant_id', tenant.id);
        set({ token, user, tenant, isAuthenticated: true });
      },
      updateTenant: (tenant) => {
        localStorage.setItem('tenant_id', tenant.id);
        set((state) => ({ ...state, tenant }));
      },
      clear: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_id');
        set({ token: null, user: null, tenant: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, tenant: state.tenant }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true;
        }
      },
    }
  )
);

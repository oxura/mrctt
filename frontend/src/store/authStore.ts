import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tenant, User } from '../types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  csrfToken: string | null;
  isAuthenticated: boolean;
  setAuth: (payload: { user: User; tenant: Tenant; csrfToken?: string | null }) => void;
  updateTenant: (tenant: Tenant) => void;
  setCsrfToken: (token: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      csrfToken: null,
      isAuthenticated: false,
      setAuth: ({ user, tenant, csrfToken }) => {
        set({ user, tenant, csrfToken: csrfToken ?? null, isAuthenticated: true });
      },
      updateTenant: (tenant) => {
        set((state) => ({ ...state, tenant }));
      },
      setCsrfToken: (token) => {
        set((state) => ({ ...state, csrfToken: token }));
      },
      clear: () => {
        set({ user: null, tenant: null, csrfToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, tenant: state.tenant, csrfToken: state.csrfToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.isAuthenticated = true;
        }
      },
    }
  )
);

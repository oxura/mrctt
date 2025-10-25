import { create } from 'zustand';
import { User } from '../types';
import { generateSessionId } from '../utils/crypto';

const SESSION_TIMEOUT_MINUTES = 30;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

interface AuthState {
  user: User | null;
  sessionId: string | null;
  sessionExpiresAt: number | null;
  isAuthenticated: boolean;
  login: (user: User, _token?: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshSession: () => void;
}

const createLoggedOutState = () => ({
  user: null,
  sessionId: null,
  sessionExpiresAt: null,
  isAuthenticated: false,
});

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...createLoggedOutState(),
  login: (user) => {
    const sanitizedUser: User = {
      ...user,
      name: user.name.trim(),
      email: user.email.trim().toLowerCase(),
    };

    set({
      user: sanitizedUser,
      sessionId: generateSessionId(),
      sessionExpiresAt: Date.now() + SESSION_TIMEOUT_MS,
      isAuthenticated: true,
    });
  },
  logout: () => set(createLoggedOutState()),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  refreshSession: () => {
    const state = get();
    if (!state.isAuthenticated) return;

    set({ sessionExpiresAt: Date.now() + SESSION_TIMEOUT_MS });
  },
}));

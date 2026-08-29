import { create } from 'zustand';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  csrfToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, csrfToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  csrfToken: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user, csrfToken) => set({ user, csrfToken, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, csrfToken: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
}));

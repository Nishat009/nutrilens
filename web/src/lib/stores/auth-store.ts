import { create } from 'zustand';
import { UserProfile } from '../types';
import { authApi } from '../../services/api-client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  checkAuth: () => Promise<UserProfile | null>;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      if (typeof window === 'undefined' || !window.localStorage.getItem('nutrilens_token')) {
        set({ isLoading: false, isAuthenticated: false, user: null });
        return null;
      }
      const { user } = await authApi.getMe();
      set({ isAuthenticated: true, user, isLoading: false });
      return user;
    } catch {
      if (typeof window !== 'undefined') window.localStorage.removeItem('nutrilens_token');
      set({ isLoading: false, isAuthenticated: false, user: null });
      return null;
    }
  },

  login: async (email: string, password?: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.login({ email, password });
      if (typeof window !== 'undefined') window.localStorage.setItem('nutrilens_token', result.token);
      set({
        isAuthenticated: true,
        user: result.user,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password?: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.register({ name, email, password });
      if (typeof window !== 'undefined') window.localStorage.setItem('nutrilens_token', result.token);
      set({
        isAuthenticated: true,
        user: result.user,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('nutrilens_token');
    set({
      isAuthenticated: false,
      user: null,
    });
  },

  setUser: (user: UserProfile) => set({ user }),
}));

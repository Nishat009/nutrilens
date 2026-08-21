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
  isAuthenticated: true,
  isLoading: false,
  user: {
    id: 'usr_prantik_99',
    name: 'Prantik Mitra',
    email: 'prantik@nutrilens.ai',
    gender: 'male',
    dob: '1998-05-14',
    heightCm: 178,
    weightKg: 74.5,
    targetWeightKg: 72.0,
    activityLevel: 'moderately_active',
    dietaryPreferences: ['High Protein / Gym', 'Mediterranean'],
    allergies: [],
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { user } = await authApi.getMe();
      set({ isAuthenticated: true, user, isLoading: false });
      return user;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  login: async (email: string, password?: string) => {
    set({ isLoading: true });
    try {
      const user = await authApi.login({ email, password });
      set({
        isAuthenticated: true,
        user,
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
      const user = await authApi.register({ name, email, password });
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      user: null,
    });
  },

  setUser: (user: UserProfile) => set({ user }),
}));

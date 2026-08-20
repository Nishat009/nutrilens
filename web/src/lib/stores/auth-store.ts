import { create } from 'zustand';
import { MOCK_USER_PROFILE } from '../../data/mock/user';
import { UserProfile } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: true, // default authenticated for seamless exploration
  user: MOCK_USER_PROFILE,
  login: async (email: string) => {
    set({
      isAuthenticated: true,
      user: {
        ...MOCK_USER_PROFILE,
        email,
      },
    });
    return true;
  },
  register: async (name: string, email: string) => {
    set({
      isAuthenticated: true,
      user: {
        ...MOCK_USER_PROFILE,
        name,
        email,
      },
    });
    return true;
  },
  logout: () => {
    set({
      isAuthenticated: false,
      user: null,
    });
  },
  setUser: (user: UserProfile) => set({ user }),
}));

import { create } from 'zustand';
import { GoalType, UserGoal, UserProfile } from '../types';
import { calculateNutritionTargets, generateUserGoalFromProfile } from '../../services/nutrition';
import { userApi } from '../../services/api-client';

interface UserState {
  profile: UserProfile;
  goal: UserGoal;
  isLoading: boolean;
  fetchUserProfile: (userId?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateGoal: (updates: Partial<UserGoal>) => Promise<void>;
  setGoalType: (type: GoalType) => Promise<void>;
  recalculateTargets: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'current',
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
};

const DEFAULT_GOAL: UserGoal = {
  id: 'goal_current',
  userId: 'current',
  type: 'lose_weight',
  targetCalories: 2150,
  targetProteinG: 160,
  targetCarbsG: 210,
  targetFatG: 65,
  targetFiberG: 32,
  targetWaterMl: 3000,
  weeklyWeightChangeKg: -0.5,
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const useUserStore = create<UserState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  goal: DEFAULT_GOAL,
  isLoading: false,

  fetchUserProfile: async (userId: string = 'current') => {
    set({ isLoading: true });
    try {
      const { user, goal } = await userApi.getProfile(userId);
      set({ profile: user, goal, isLoading: false });
    } catch (err) {
      console.warn('Failed to load user profile from backend, using current active state:', err);
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const { profile, goal } = get();
    const newProfile = { ...profile, ...updates };

    let newGoal = goal;
    if (
      updates.weightKg !== undefined ||
      updates.heightCm !== undefined ||
      updates.activityLevel !== undefined ||
      updates.gender !== undefined ||
      updates.dob !== undefined
    ) {
      newGoal = generateUserGoalFromProfile(newProfile.id, newProfile, goal.type);
    }

    set({ profile: newProfile, goal: newGoal });

    try {
      const userId = profile.id || 'current';
      await userApi.updateProfile(userId, updates);
      if (newGoal !== goal) {
        await userApi.updateGoal(userId, newGoal);
      }
    } catch (err) {
      console.error('Failed to sync profile update with backend:', err);
    }
  },

  updateGoal: async (updates) => {
    const { profile, goal } = get();
    const newGoal = { ...goal, ...updates };
    set({ goal: newGoal });

    try {
      const userId = profile.id || 'current';
      await userApi.updateGoal(userId, updates);
    } catch (err) {
      console.error('Failed to sync goal update with backend:', err);
    }
  },

  setGoalType: async (type: GoalType) => {
    const { profile } = get();
    const newGoal = generateUserGoalFromProfile(profile.id, profile, type);
    set({ goal: newGoal });

    try {
      const userId = profile.id || 'current';
      await userApi.updateGoal(userId, newGoal);
    } catch (err) {
      console.error('Failed to sync goal type change with backend:', err);
    }
  },

  recalculateTargets: async () => {
    const { profile, goal } = get();
    const targets = calculateNutritionTargets(profile, goal.type);
    const updatedGoal: UserGoal = {
      ...goal,
      targetCalories: targets.targetCalories,
      targetProteinG: targets.targetProteinG,
      targetCarbsG: targets.targetCarbsG,
      targetFatG: targets.targetFatG,
      targetFiberG: targets.targetFiberG,
      targetWaterMl: targets.targetWaterMl,
    };

    set({ goal: updatedGoal });

    try {
      const userId = profile.id || 'current';
      await userApi.updateGoal(userId, updatedGoal);
    } catch (err) {
      console.error('Failed to sync recalculated targets with backend:', err);
    }
  },
}));

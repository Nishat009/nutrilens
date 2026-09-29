import { create } from 'zustand';
import { GoalType, UserGoal, UserProfile } from '../types';
import { calculateNutritionTargets, generateUserGoalFromProfile } from '../../services/nutrition';
import { userApi } from '../../services/api-client';

interface UserState {
  profile: UserProfile;
  goal: UserGoal;
  isLoading: boolean;
  fetchUserProfile: (userId?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile> & { goal?: Partial<UserGoal> }) => Promise<void>;
  updateGoal: (updates: Partial<UserGoal>) => Promise<void>;
  setGoalType: (type: GoalType) => Promise<void>;
  recalculateTargets: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'current',
  name: 'Alex Morgan',
  email: 'alex.morgan@nutrilens.ai',
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
      console.error('Failed to load user profile from database:', err);
      set({ isLoading: false });
      throw err;
    }
  },

  updateProfile: async (updates) => {
    const { profile, goal } = get();
    const { goal: goalUpdates, ...profileUpdates } = updates;
    const newProfile = { ...profile, ...profileUpdates };

    let newGoal = goal;
    if (
      profileUpdates.weightKg !== undefined ||
      profileUpdates.heightCm !== undefined ||
      profileUpdates.activityLevel !== undefined ||
      profileUpdates.gender !== undefined ||
      profileUpdates.dob !== undefined ||
      profileUpdates.primaryGoal !== undefined
    ) {
      newGoal = generateUserGoalFromProfile(newProfile.id, newProfile, profileUpdates.primaryGoal || goal.type);
    }
    newGoal = { ...newGoal, ...goalUpdates };

    try {
      const userId = profile.id || 'current';
      const saved = await userApi.updateProfile(userId, { ...profileUpdates, goal: newGoal });
      set({ profile: saved.user, goal: saved.goal });
    } catch (err) {
      console.error('Failed to sync profile update with backend:', err);
      throw err;
    }
  },

  updateGoal: async (updates) => {
    const { profile, goal } = get();
    const newGoal = { ...goal, ...updates };
    try {
      const userId = profile.id || 'current';
      const saved = await userApi.updateGoal(userId, updates);
      set({ goal: saved });
    } catch (err) {
      console.error('Failed to sync goal update with backend:', err);
      throw err;
    }
  },

  setGoalType: async (type: GoalType) => {
    const { profile } = get();
    const newGoal = generateUserGoalFromProfile(profile.id, profile, type);
    try {
      const userId = profile.id || 'current';
      const saved = await userApi.updateGoal(userId, newGoal);
      set({ goal: saved });
    } catch (err) {
      console.error('Failed to sync goal type change with backend:', err);
      throw err;
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

    try {
      const userId = profile.id || 'current';
      const saved = await userApi.updateGoal(userId, updatedGoal);
      set({ goal: saved });
    } catch (err) {
      console.error('Failed to sync recalculated targets with backend:', err);
      throw err;
    }
  },
}));

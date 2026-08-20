import { create } from 'zustand';
import { MOCK_USER_GOAL, MOCK_USER_PROFILE } from '../../data/mock/user';
import { GoalType, UserGoal, UserProfile } from '../types';
import { calculateNutritionTargets, generateUserGoalFromProfile } from '../../services/nutrition';

interface UserState {
  profile: UserProfile;
  goal: UserGoal;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateGoal: (updates: Partial<UserGoal>) => void;
  setGoalType: (type: GoalType) => void;
  recalculateTargets: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: MOCK_USER_PROFILE,
  goal: MOCK_USER_GOAL,
  updateProfile: (updates) => {
    set((state) => {
      const newProfile = { ...state.profile, ...updates };
      // auto recalculate goals if body stats changed
      if (
        updates.weightKg !== undefined ||
        updates.heightCm !== undefined ||
        updates.activityLevel !== undefined ||
        updates.gender !== undefined ||
        updates.dob !== undefined
      ) {
        const newGoal = generateUserGoalFromProfile(newProfile.id, newProfile, state.goal.type);
        return { profile: newProfile, goal: newGoal };
      }
      return { profile: newProfile };
    });
  },
  updateGoal: (updates) => {
    set((state) => ({ goal: { ...state.goal, ...updates } }));
  },
  setGoalType: (type: GoalType) => {
    const { profile } = get();
    const newGoal = generateUserGoalFromProfile(profile.id, profile, type);
    set({ goal: newGoal });
  },
  recalculateTargets: () => {
    const { profile, goal } = get();
    const targets = calculateNutritionTargets(profile, goal.type);
    set((state) => ({
      goal: {
        ...state.goal,
        targetCalories: targets.targetCalories,
        targetProteinG: targets.targetProteinG,
        targetCarbsG: targets.targetCarbsG,
        targetFatG: targets.targetFatG,
        targetFiberG: targets.targetFiberG,
        targetWaterMl: targets.targetWaterMl,
      },
    }));
  },
}));

import { UserGoal, UserProfile } from '../../lib/types';

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'usr_alex_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@nutrilens.ai',
  gender: 'male',
  dob: '1998-05-14',
  heightCm: 178,
  weightKg: 74.5,
  targetWeightKg: 72.0,
  activityLevel: 'moderately_active',
  dietaryPreferences: ['High Protein / Gym', 'Mediterranean', 'Intermittent Fasting (16/8)'],
  allergies: ['Peanuts'],
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
};

export const MOCK_USER_GOAL: UserGoal = {
  id: 'goal_active_01',
  userId: 'usr_alex_01',
  type: 'lose_weight',
  targetCalories: 2150,
  targetProteinG: 160,
  targetCarbsG: 210,
  targetFatG: 65,
  targetFiberG: 32,
  targetWaterMl: 3000,
  weeklyWeightChangeKg: -0.5,
  isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z',
};

import { ActivityLevel, GoalType, MealType } from '../types';

export const APP_NAME = 'NutriLens';
export const APP_TAGLINE = 'Precision AI Food Recognition & Intelligent Health Dashboard';

export const ACTIVITY_LEVEL_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // Little or no exercise
  lightly_active: 1.375, // Light exercise 1-3 days/week
  moderately_active: 1.55, // Moderate exercise 3-5 days/week
  very_active: 1.725, // Hard exercise 6-7 days/week
  extra_active: 1.9, // Very hard daily exercise / physical job
};

export const ACTIVITY_LEVEL_DETAILS: Record<ActivityLevel, { label: string; desc: string }> = {
  sedentary: {
    label: 'Sedentary',
    desc: 'Desk job, little to no regular exercise',
  },
  lightly_active: {
    label: 'Lightly Active',
    desc: 'Light workouts or walks 1-3 days/week',
  },
  moderately_active: {
    label: 'Moderately Active',
    desc: 'Moderate gym/sports 3-5 days/week',
  },
  very_active: {
    label: 'Very Active',
    desc: 'Intense training/sports 6-7 days/week',
  },
  extra_active: {
    label: 'Extremely Active',
    desc: 'Heavy physical labor or twice-a-day training',
  },
};

export const GOAL_OPTIONS: Record<GoalType, { label: string; desc: string; calorieOffset: number }> = {
  lose_weight: {
    label: 'Fat Loss & Definition',
    desc: 'Moderate caloric deficit (~500 kcal/day) preserving lean mass',
    calorieOffset: -500,
  },
  maintain: {
    label: 'Healthy Maintenance',
    desc: 'Equilibrium calories optimizing energy & metabolic stability',
    calorieOffset: 0,
  },
  gain_muscle: {
    label: 'Lean Muscle Hypertrophy',
    desc: 'Controlled caloric surplus (~300 kcal/day) high in bioavailable protein',
    calorieOffset: 300,
  },
};

export const MEAL_TYPE_CONFIG: Record<MealType, { label: string; icon: string; defaultTime: string; color: string }> = {
  breakfast: {
    label: 'Breakfast',
    icon: 'Sun',
    defaultTime: '08:00',
    color: '#f59e0b',
  },
  lunch: {
    label: 'Lunch',
    icon: 'Utensils',
    defaultTime: '13:00',
    color: '#10b981',
  },
  dinner: {
    label: 'Dinner',
    icon: 'Moon',
    defaultTime: '19:30',
    color: '#8b5cf6',
  },
  snack: {
    label: 'Snacks & Fuel',
    icon: 'Apple',
    defaultTime: '16:00',
    color: '#06b6d4',
  },
};

export const DIETARY_PREFERENCES_LIST = [
  'Balanced Omnivore',
  'High Protein / Gym',
  'Mediterranean',
  'Ketogenic / Low-Carb',
  'Plant-Based / Vegan',
  'Vegetarian',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
  'Intermittent Fasting (16/8)',
];

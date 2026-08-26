import { create } from 'zustand';
import { DailyNutrition, Meal, MealItem, MealType } from '../types';
import { getTodayDateString } from '../utils/format';
import { mealApi } from '../../services/api-client';

interface MealState {
  meals: Meal[];
  isLoading: boolean;
  waterIntakeMl: number;
  fetchMeals: (date?: string, userId?: string) => Promise<void>;
  addWater: (amountMl: number) => void;
  setWaterIntake: (amountMl: number) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => Promise<Meal>;
  deleteMeal: (id: string) => Promise<void>;
  getMealsByDate: (date: string) => Meal[];
  getMealById: (id: string) => Meal | undefined;
  getDailyNutritionForDate: (date: string) => DailyNutrition;
}

export const useMealStore = create<MealState>((set, get) => ({
  meals: [],
  isLoading: false,
  waterIntakeMl: 0,

  fetchMeals: async (date?: string, userId?: string) => {
    set({ isLoading: true });
    try {
      const fetchedMeals = await mealApi.getMeals({ date, userId });
      if (date) {
        // Merge or replace meals for the specified date
        set((state) => {
          const otherMeals = state.meals.filter((m) => m.date !== date);
          return { meals: [...fetchedMeals, ...otherMeals], isLoading: false };
        });
      } else {
        set({ meals: fetchedMeals, isLoading: false });
      }
    } catch (err) {
      console.warn('Failed to fetch meals from backend:', err);
      set({ isLoading: false });
    }
  },

  addWater: (amountMl) => {
    set((state) => ({ waterIntakeMl: Math.max(0, state.waterIntakeMl + amountMl) }));
  },

  setWaterIntake: (amountMl) => set({ waterIntakeMl: amountMl }),

  addMeal: async (mealData) => {
    try {
      const createdMeal = await mealApi.createMeal(mealData);
      set((state) => ({ meals: [createdMeal, ...state.meals] }));
      return createdMeal;
    } catch (err) {
      console.error('Failed to create meal on backend, saving locally:', err);
      const fallbackMeal: Meal = {
        ...mealData,
        id: 'meal_' + Date.now().toString(36),
      };
      set((state) => ({ meals: [fallbackMeal, ...state.meals] }));
      return fallbackMeal;
    }
  },

  deleteMeal: async (id: string) => {
    set((state) => ({ meals: state.meals.filter((m) => m.id !== id) }));
    try {
      await mealApi.deleteMeal(id);
    } catch (err) {
      console.error('Failed to delete meal from backend:', err);
    }
  },

  getMealsByDate: (date: string) => {
    return get().meals.filter((m) => m.date === date);
  },

  getMealById: (id: string) => {
    return get().meals.find((m) => m.id === id);
  },

  getDailyNutritionForDate: (date: string) => {
    const dayMeals = get().meals.filter((m) => m.date === date);
    const totals = dayMeals.reduce(
      (acc, m) => ({
        totalCalories: acc.totalCalories + m.totalCalories,
        totalProtein: acc.totalProtein + m.totalProtein,
        totalCarbs: acc.totalCarbs + m.totalCarbs,
        totalFat: acc.totalFat + m.totalFat,
        totalFiber: acc.totalFiber + m.totalFiber,
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 }
    );

    return {
      date,
      totalCalories: totals.totalCalories,
      totalProtein: Math.round(totals.totalProtein * 10) / 10,
      totalCarbs: Math.round(totals.totalCarbs * 10) / 10,
      totalFat: Math.round(totals.totalFat * 10) / 10,
      totalFiber: Math.round(totals.totalFiber * 10) / 10,
      waterIntakeMl: date === getTodayDateString() ? get().waterIntakeMl : 2400,
      mealsLoggedCount: dayMeals.length,
    };
  },
}));

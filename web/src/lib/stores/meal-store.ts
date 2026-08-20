import { create } from 'zustand';
import { MOCK_MEALS } from '../../data/mock/meals';
import { DailyNutrition, Meal, MealItem, MealType } from '../types';
import { getTodayDateString } from '../utils/format';

interface MealState {
  meals: Meal[];
  waterIntakeMl: number;
  addWater: (amountMl: number) => void;
  setWaterIntake: (amountMl: number) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => Meal;
  deleteMeal: (id: string) => void;
  getMealsByDate: (date: string) => Meal[];
  getMealById: (id: string) => Meal | undefined;
  getDailyNutritionForDate: (date: string) => DailyNutrition;
}

export const useMealStore = create<MealState>((set, get) => ({
  meals: MOCK_MEALS,
  waterIntakeMl: 1800,
  addWater: (amountMl) => {
    set((state) => ({ waterIntakeMl: Math.max(0, state.waterIntakeMl + amountMl) }));
  },
  setWaterIntake: (amountMl) => set({ waterIntakeMl: amountMl }),
  addMeal: (mealData) => {
    const newMeal: Meal = {
      ...mealData,
      id: 'meal_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    };
    set((state) => ({ meals: [newMeal, ...state.meals] }));
    return newMeal;
  },
  deleteMeal: (id) => {
    set((state) => ({ meals: state.meals.filter((m) => m.id !== id) }));
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

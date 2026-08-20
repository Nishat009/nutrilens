export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
export type GoalType = 'lose_weight' | 'maintain' | 'gain_muscle';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ScanStatus = 'uploading' | 'identifying' | 'estimating' | 'calculating' | 'completed' | 'failed';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender: Gender;
  dob: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietaryPreferences: string[];
  allergies: string[];
  targetWeightKg?: number;
  avatarUrl?: string;
}

export interface UserGoal {
  id: string;
  userId: string;
  type: GoalType;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
  targetWaterMl: number;
  weeklyWeightChangeKg: number;
  isActive: boolean;
  createdAt: string;
}

export interface FoodNutrition {
  calories: number;
  protein: number; // in grams per 100g or serving
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number; // in mg
}

export interface Food {
  id: string;
  name: string;
  category: string;
  servingSize: number;
  servingUnit: string;
  nutrition: FoodNutrition;
  imageUrl?: string;
  tags?: string[];
}

export interface MealItem {
  id: string;
  foodId?: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence?: number;
}

export interface Meal {
  id: string;
  userId: string;
  type: MealType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  items: MealItem[];
  imageUrl?: string;
  notes?: string;
}

export interface FoodScanItem {
  id: string;
  name: string;
  confidence: number;
  estimatedQuantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  foodId?: string;
}

export interface FoodScan {
  id: string;
  userId: string;
  imageUrl: string;
  status: ScanStatus;
  createdAt: string;
  detectedItems: FoodScanItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  suggestedMealType: MealType;
  analysisNotes?: string;
}

export interface DailyNutrition {
  date: string; // YYYY-MM-DD
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  waterIntakeMl: number;
  mealsLoggedCount: number;
}

export interface WeightLog {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
}

export interface DietPlan {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  fullOverview: string;
  icon: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  macroRatio: {
    protein: number; // percentage (0-100)
    carbs: number;
    fat: number;
  };
  keyBenefits: string[];
  allowedFoods: string[];
  foodsToLimit: string[];
  sampleMealDay: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
  };
}

export interface PlannedMealSlot {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  mealType: MealType;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recommendation {
  id: string;
  title: string;
  category: 'nutrition' | 'hydration' | 'recovery' | 'goal_pacing';
  message: string;
  actionText?: string;
  actionUrl?: string;
  severity: 'info' | 'success' | 'warning';
  createdAt: string;
}

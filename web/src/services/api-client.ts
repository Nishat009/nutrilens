import {
  DailyNutrition,
  DietPlan,
  Food,
  FoodScan,
  Meal,
  PlannedMealSlot,
  UserGoal,
  UserProfile,
  WeightLog,
} from '../lib/types';

// Use deployed backend URL if set, otherwise relative path
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
  : '';

interface ApiResponse<T = any> {
  success: boolean;
  code?: number;
  message?: string;
  count?: number;
  data?: T;
  result?: T;
  errors?: string[];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    errors: ['Failed to parse JSON response from server'],
  }));

  if (!response.ok || data.success === false) {
    const errorMsg =
      data.errors && data.errors.length > 0
        ? data.errors.join(', ')
        : data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return (data.data !== undefined ? data.data : data.result !== undefined ? data.result : (data as unknown as T)) as T;
}

// ----------------------------------------------------
// 1. Auth API
// ----------------------------------------------------
export const authApi = {
  async register(body: {
    name: string;
    email: string;
    password?: string;
    gender?: string;
    dob?: string;
    heightCm?: number;
    weightKg?: number;
    activityLevel?: string;
  }): Promise<UserProfile> {
    const res = await request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return normalizeUser(res);
  },

  async login(body: { email: string; password?: string }): Promise<UserProfile> {
    const res = await request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return normalizeUser(res);
  },

  async getMe(): Promise<{ user: UserProfile; goal: UserGoal }> {
    const res = await request<any>('/api/auth/me');
    return {
      user: normalizeUser(res),
      goal: normalizeGoal(res.goal, res._id || res.id),
    };
  },
};

// ----------------------------------------------------
// 2. User & Goal API
// ----------------------------------------------------
export const userApi = {
  async getProfile(userId: string = 'current'): Promise<{ user: UserProfile; goal: UserGoal }> {
    const res = await request<any>(`/api/users/${userId}`);
    return {
      user: normalizeUser(res),
      goal: normalizeGoal(res.goal, res._id || res.id),
    };
  },

  async updateProfile(userId: string = 'current', updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await request<any>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return normalizeUser(res);
  },

  async updateGoal(userId: string = 'current', updates: Partial<UserGoal>): Promise<UserGoal> {
    const res = await request<any>(`/api/users/${userId}/goal`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return normalizeGoal(res, userId);
  },
};

// ----------------------------------------------------
// 3. Meals API
// ----------------------------------------------------
export const mealApi = {
  async getMeals(params?: { userId?: string; date?: string }): Promise<Meal[]> {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId);
    if (params?.date) query.append('date', params.date);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<any[]>(`/api/meals${qs}`);
    return (res || []).map(normalizeMeal);
  },

  async getMealById(id: string): Promise<Meal> {
    const res = await request<any>(`/api/meals/${id}`);
    return normalizeMeal(res);
  },

  async createMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    const res = await request<any>('/api/meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    });
    return normalizeMeal(res);
  },

  async deleteMeal(id: string): Promise<void> {
    await request<any>(`/api/meals/${id}`, {
      method: 'DELETE',
    });
  },
};

// ----------------------------------------------------
// 4. Foods Database API
// ----------------------------------------------------
export const foodApi = {
  async getFoods(params?: { category?: string; search?: string }): Promise<Food[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<any[]>(`/api/foods${qs}`);
    return (res || []).map(normalizeFood);
  },

  async getFoodById(id: string): Promise<Food> {
    const res = await request<any>(`/api/foods/${id}`);
    return normalizeFood(res);
  },

  async searchFoods(search: string, category?: string): Promise<Food[]> {
    return this.getFoods({ search, category });
  },
};

// ----------------------------------------------------
// 5. Food Scans & Vision Recognition API
// ----------------------------------------------------
export const scanApi = {
  async analyzeImage(image: string, mealType?: string): Promise<any> {
    const res = await request<any>('/api/scans/analyze', {
      method: 'POST',
      body: JSON.stringify({ image, mealType }),
    });
    return res;
  },

  async getScans(userId?: string): Promise<FoodScan[]> {
    const query = userId ? `?userId=${userId}` : '';
    const res = await request<any[]>(`/api/scans${query}`);
    return (res || []).map(normalizeScan);
  },

  async getScanById(id: string): Promise<FoodScan> {
    const res = await request<any>(`/api/scans/${id}`);
    return normalizeScan(res);
  },

  async createScan(scan: Partial<FoodScan>): Promise<FoodScan> {
    const res = await request<any>('/api/scans', {
      method: 'POST',
      body: JSON.stringify(scan),
    });
    return normalizeScan(res);
  },
};

// ----------------------------------------------------
// 6. Progress & Weight Logs API
// ----------------------------------------------------
export const progressApi = {
  async getWeightLogs(userId?: string): Promise<WeightLog[]> {
    const query = userId ? `?userId=${userId}` : '';
    const res = await request<any[]>(`/api/progress/weight${query}`);
    return (res || []).map((item) => ({
      id: item._id || item.id,
      date: item.date,
      weightKg: item.weightKg,
      notes: item.notes || '',
    }));
  },

  async logWeight(data: { userId?: string; date?: string; weightKg: number; notes?: string }): Promise<WeightLog> {
    const res = await request<any>('/api/progress/weight', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      id: res._id || res.id,
      date: res.date,
      weightKg: res.weightKg,
      notes: res.notes || '',
    };
  },

  async getNutritionHistory(params?: { userId?: string; days?: number }): Promise<DailyNutrition[]> {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId);
    if (params?.days) query.append('days', params.days.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<DailyNutrition[]>(`/api/progress/nutrition${qs}`);
    return res || [];
  },
};

// ----------------------------------------------------
// 7. Diets API
// ----------------------------------------------------
export const dietApi = {
  async getDiets(): Promise<DietPlan[]> {
    const res = await request<any[]>('/api/diets');
    return (res || []).map(normalizeDiet);
  },

  async getDietBySlug(slug: string): Promise<DietPlan> {
    const res = await request<any>(`/api/diets/${slug}`);
    return normalizeDiet(res);
  },

  async adoptDiet(dietName: string, userId?: string): Promise<UserProfile> {
    const res = await request<any>('/api/diets/adopt', {
      method: 'POST',
      body: JSON.stringify({ dietName, userId }),
    });
    return normalizeUser(res);
  },
};

// ----------------------------------------------------
// 8. Weekly Meal Planner API
// ----------------------------------------------------
export const plannerApi = {
  async getPlannedMeals(params?: { userId?: string; dayOfWeek?: number }): Promise<PlannedMealSlot[]> {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId);
    if (params?.dayOfWeek !== undefined) query.append('dayOfWeek', params.dayOfWeek.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<any[]>(`/api/planner${qs}`);
    return (res || []).map((p) => ({
      id: p._id || p.id,
      dayOfWeek: p.dayOfWeek,
      mealType: p.mealType,
      foodName: p.foodName,
      calories: p.calories,
      protein: p.protein,
      carbs: p.carbs,
      fat: p.fat,
    }));
  },

  async addPlannedMeal(meal: Omit<PlannedMealSlot, 'id'> & { userId?: string }): Promise<PlannedMealSlot> {
    const res = await request<any>('/api/planner', {
      method: 'POST',
      body: JSON.stringify(meal),
    });
    return {
      id: res._id || res.id,
      dayOfWeek: res.dayOfWeek,
      mealType: res.mealType,
      foodName: res.foodName,
      calories: res.calories,
      protein: res.protein,
      carbs: res.carbs,
      fat: res.fat,
    };
  },

  async deletePlannedMeal(id: string): Promise<void> {
    await request<any>(`/api/planner/${id}`, {
      method: 'DELETE',
    });
  },
};

// ----------------------------------------------------
// Normalizer Helpers (Transform MongoDB documents to frontend interfaces)
// ----------------------------------------------------
function normalizeUser(doc: any): UserProfile {
  if (!doc) {
    return {
      id: 'default_usr',
      name: 'NutriLens User',
      email: 'user@nutrilens.ai',
      gender: 'male',
      dob: '1998-05-14',
      heightCm: 178,
      weightKg: 74.5,
      targetWeightKg: 72.0,
      activityLevel: 'moderately_active',
      dietaryPreferences: [],
      allergies: [],
    };
  }

  return {
    id: doc._id || doc.id || 'usr_1',
    name: doc.name || 'NutriLens User',
    email: doc.email || '',
    gender: doc.gender || 'male',
    dob: doc.dob || '1998-05-14',
    heightCm: doc.heightCm || 178,
    weightKg: doc.weightKg || 74.5,
    targetWeightKg: doc.targetWeightKg || 72.0,
    activityLevel: doc.activityLevel || 'moderately_active',
    dietaryPreferences: doc.dietaryPreferences || [],
    allergies: doc.allergies || [],
    avatarUrl: doc.avatarUrl,
  };
}

function normalizeGoal(doc: any, userId: string = 'usr_1'): UserGoal {
  if (!doc) {
    return {
      id: 'goal_default',
      userId,
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
  }

  return {
    id: doc._id || doc.id || 'goal_' + Math.random().toString(36).substring(2, 6),
    userId,
    type: doc.type || 'lose_weight',
    targetCalories: doc.targetCalories || 2150,
    targetProteinG: doc.targetProteinG || 160,
    targetCarbsG: doc.targetCarbsG || 210,
    targetFatG: doc.targetFatG || 65,
    targetFiberG: doc.targetFiberG || 32,
    targetWaterMl: doc.targetWaterMl || 3000,
    weeklyWeightChangeKg: doc.weeklyWeightChangeKg !== undefined ? doc.weeklyWeightChangeKg : -0.5,
    isActive: doc.isActive !== undefined ? doc.isActive : true,
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}

function normalizeMeal(doc: any): Meal {
  return {
    id: doc._id || doc.id || 'meal_' + Math.random().toString(36).substring(2, 6),
    userId: doc.userId || '',
    type: doc.type || 'lunch',
    date: doc.date || new Date().toISOString().split('T')[0],
    time: doc.time || '12:00',
    totalCalories: doc.totalCalories || 0,
    totalProtein: doc.totalProtein || 0,
    totalCarbs: doc.totalCarbs || 0,
    totalFat: doc.totalFat || 0,
    totalFiber: doc.totalFiber || 0,
    items: (doc.items || []).map((i: any) => ({
      id: i._id || i.id || `item_${Math.random().toString(36).substring(2, 6)}`,
      foodId: i.foodId,
      foodName: i.foodName || i.name,
      quantity: i.quantity || 100,
      unit: i.unit || 'g',
      calories: i.calories || 0,
      protein: i.protein || 0,
      carbs: i.carbs || 0,
      fat: i.fat || 0,
      fiber: i.fiber || 0,
      confidence: i.confidence,
    })),
    imageUrl: doc.imageUrl || '',
    notes: doc.notes || '',
  };
}

function normalizeFood(doc: any): Food {
  return {
    id: doc._id || doc.id,
    name: doc.name,
    category: doc.category,
    servingSize: doc.servingSize || 100,
    servingUnit: doc.servingUnit || 'g',
    nutrition: doc.nutrition || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
    imageUrl: doc.imageUrl,
    tags: doc.tags || [],
  };
}

function normalizeScan(doc: any): FoodScan {
  return {
    id: doc._id || doc.id,
    userId: doc.userId,
    imageUrl: doc.imageUrl,
    status: doc.status || 'completed',
    createdAt: doc.createdAt || new Date().toISOString(),
    suggestedMealType: doc.suggestedMealType || 'lunch',
    analysisNotes: doc.analysisNotes || '',
    totalCalories: doc.totalCalories || 0,
    totalProtein: doc.totalProtein || 0,
    totalCarbs: doc.totalCarbs || 0,
    totalFat: doc.totalFat || 0,
    totalFiber: doc.totalFiber || 0,
    detectedItems: (doc.detectedItems || []).map((i: any) => ({
      id: i._id || i.id,
      name: i.name,
      confidence: i.confidence,
      estimatedQuantity: i.estimatedQuantity || 100,
      unit: i.unit || 'g',
      calories: i.calories || 0,
      protein: i.protein || 0,
      carbs: i.carbs || 0,
      fat: i.fat || 0,
      fiber: i.fiber || 0,
      foodId: i.foodId,
    })),
  };
}

function normalizeDiet(doc: any): DietPlan {
  return {
    id: doc._id || doc.id,
    slug: doc.slug,
    name: doc.name,
    tagline: doc.tagline,
    description: doc.description,
    fullOverview: doc.fullOverview,
    icon: doc.icon || 'Sparkles',
    difficulty: doc.difficulty || 'Moderate',
    macroRatio: doc.macroRatio || { protein: 30, carbs: 40, fat: 30 },
    keyBenefits: doc.keyBenefits || [],
    allowedFoods: doc.allowedFoods || [],
    foodsToLimit: doc.foodsToLimit || [],
    sampleMealDay: doc.sampleMealDay || {
      breakfast: '',
      lunch: '',
      dinner: '',
      snack: '',
    },
  };
}

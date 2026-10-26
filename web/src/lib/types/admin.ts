import { UserRole } from './index';

export interface AdminScan {
  id: string;
  userName: string;
  userEmail?: string;
  imageUrl: string | null;
  mealType: string;
  status: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  items: { name: string; confidence: number }[];
  avgConfidence: number | null;
  createdAt: string;
}

export interface AdminOverview {
  totals: {
    members: number;
    admins: number;
    newMembers7d: number;
    onboardedMembers: number;
    meals: number;
    scans: number;
    weightLogs: number;
    plannedMeals: number;
    foods: number;
    vegetables: number;
    publishedVegetables: number;
    learnedMatches: number;
    dietProtocols: number;
  };
  activity: { date: string; meals: number; scans: number; calories: number }[];
  goals: { goal: string; count: number }[];
  dietAdoption: { diet: string; count: number }[];
  conditions: { condition: string; count: number }[];
  mealTypes: { type: string; count: number; avgCalories: number }[];
  avgScanConfidence: number | null;
  recentMembers: {
    id: string;
    name: string;
    email: string;
    primaryGoal?: string;
    onboardingCompleted: boolean;
    isDemo: boolean;
    dietName: string | null;
    createdAt: string;
  }[];
  recentScans: AdminScan[];
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isDemo: boolean;
  primaryGoal?: string;
  healthConditions: string[];
  onboardingCompleted: boolean;
  avatarUrl: string;
  dietName: string | null;
  targetCalories: number | null;
  mealCount: number;
  lastMealDate: string | null;
  scanCount: number;
  createdAt: string;
}

export interface Paginated {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminUserList extends Paginated {
  users: AdminUserRow[];
}

export interface AdminUserDetail {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isDemo: boolean;
    gender?: string;
    dob?: string;
    heightCm?: number;
    weightKg?: number;
    targetWeightKg?: number;
    activityLevel?: string;
    primaryGoal?: string;
    healthConditions: string[];
    allergies: string[];
    foodPreferences: string[];
    onboardingCompleted: boolean;
    goal: { targetCalories?: number; targetProteinG?: number; targetCarbsG?: number; targetFatG?: number } | null;
    plan: {
      dietName: string;
      targetCalories?: number;
      bmi?: number;
      bmiCategory?: string;
      tdee?: number;
      requiresDoctorConsult: boolean;
      safetyMessages: string[];
    } | null;
    createdAt: string;
  };
  stats: {
    meals: number;
    scans: number;
    weightLogs: number;
    plannedMeals: number;
    latestWeight: { date: string; weightKg: number } | null;
  };
  recentMeals: { id: string; type: string; date: string; time: string; totalCalories: number; totalProtein: number; foods: string[] }[];
  recentScans: AdminScan[];
}

export interface AdminScanList extends Paginated {
  stats: {
    total: number;
    last7d: number;
    detectedItems: number;
    avgConfidence: number | null;
    lowConfidenceItems: number;
    learnedMatches: number;
  };
  scans: AdminScan[];
  learned: { id: string; foodName: string; category: string; learnedCount: number; confidenceScore: number; updatedAt: string }[];
}

type PercentRange = { min: number; max: number } | null;

export interface AdminDietProtocol {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: string;
  difficulty: string;
  evidenceLevel: string;
  suitableConditions: string[];
  requiresProfessionalReview: string[];
  medicalReviewRequired: boolean;
  macros: { protein: PercentRange; carbs: PercentRange; fat: PercentRange };
}

export interface AdminDietCatalog {
  protocols: AdminDietProtocol[];
  adoption: { diet: string; count: number }[];
}

export type CatalogType = 'vegetables' | 'foods';

export interface AdminCatalogItem {
  id: string;
  name: string;
  category: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  tags?: string[];
  source?: string;
  isActive?: boolean;
  imageUrl?: string;
}

export interface AdminCatalog extends Paginated {
  type: CatalogType;
  categories: { name: string; count: number }[];
  items: AdminCatalogItem[];
}

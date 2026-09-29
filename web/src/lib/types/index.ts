export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
export type GoalType =
  | 'lose_weight'
  | 'reduce_belly_fat'
  | 'gain_muscle'
  | 'body_recomposition'
  | 'maintain'
  | 'general_health'
  | 'blood_sugar'
  | 'blood_pressure';

export type WeightLossPace = 'slow_sustainable' | 'moderate' | 'faster';

export type HealthCondition =
  | 'diabetes'
  | 'prediabetes'
  | 'hypertension'
  | 'pcos'
  | 'thyroid'
  | 'high_cholesterol'
  | 'fatty_liver'
  | 'kidney_disease'
  | 'liver_disease'
  | 'gerd'
  | 'ibs'
  | 'anemia'
  | 'pregnancy_breastfeeding'
  | 'none'
  | 'other';

export type FoodPreferenceType =
  | 'no_preference'
  | 'balanced'
  | 'high_protein'
  | 'low_carb'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'traditional_bangladeshi'
  | 'flexible';

export type AllergyType =
  | 'dairy'
  | 'egg'
  | 'fish'
  | 'seafood'
  | 'peanut'
  | 'treenut'
  | 'gluten'
  | 'soy'
  | 'other'
  | 'none';

export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'snack';
export type ScanStatus = 'uploading' | 'identifying' | 'estimating' | 'calculating' | 'completed' | 'failed';

export interface LifestyleProfile {
  sleepHours: 'less_than_5' | '5_to_6' | '6_to_8' | '8_plus';
  workType: 'desk_job' | 'mixed' | 'physical_labor';
  mealFrequency: 2 | 3 | 4 | 5;
  cookingHabit: 'self_cook' | 'family_cooks' | 'mostly_takeaway';
  budgetLevel: 'low' | 'medium' | 'flexible';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender: Gender;
  dob: string;
  heightCm: number;
  weightKg: number;
  medicalConditions?: string[];
  medications?: string[];
  activeDietId?: string;
  targetWeightKg?: number;
  waistCm?: number;
  activityLevel: ActivityLevel;
  primaryGoal?: GoalType;
  goalPace?: WeightLossPace;
  healthConditions?: HealthCondition[];
  foodPreferences?: FoodPreferenceType[];
  commonFoodsEaten?: string[];
  allergies: string[];
  lifestyle?: LifestyleProfile;
  dietaryPreferences: string[];
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  personalizedPlan?: PersonalizedDietPlan;
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

export interface DietPlanSuitability {
  recommendedFor: string[];
  contraindications: string[];
}

export interface EvidenceProfile {
  mechanism_summary: string;
  potential_benefits: string[];
  evidence_level: 'strong' | 'moderate' | 'limited' | 'emerging' | 'traditional';
}

export interface ClinicalProfile {
  primary_goals: string[];
  suitable_conditions: string[];
  requires_professional_review: string[];
}

export interface Eligibility {
  minimum_age: number;
  maximum_age?: number | null;
  bmi: string[];
  activity_levels: string[];
}

export interface NutritionStrategy {
  calorie_mode: string;
  protein: string;
  carbohydrate: string;
  fat: string;
  fiber: string;
  sodium: string;
}

export interface MacroRange {
  min: number;
  max: number;
}

export interface DietPlan {
  id?: string;
  _id?: string;
  slug: string;
  name: string;
  category?: string;
  status?: string;
  tagline: string;
  description: string;
  fullOverview: string;
  icon: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Advanced';
  targetAudience?: string;
  targetWeightCategory?: string;
  clinical_profile?: ClinicalProfile;
  eligibility?: Eligibility;
  nutrition_strategy?: NutritionStrategy;
  evidence_profile?: EvidenceProfile;
  safety?: {
    automatic_recommendation: boolean;
    medical_review_required: boolean;
  };
  macroRatio: {
    mode?: string;
    protein: number; // percentage (0-100)
    carbs: number;
    fat: number;
    protein_percent?: MacroRange;
    carbohydrate_percent?: MacroRange;
    fat_percent?: MacroRange;
  };
  keyBenefits: string[];
  allowedFoods: string[];
  foodsToLimit: string[];
  forbiddenKeywords?: string[];
  guidelines?: string[];
  pcosAndThyroidBenefits?: string;
  suitability?: DietPlanSuitability;
  sampleMealDay: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
  };
  isFeatured?: boolean;
  suitableFor?: string[];
  goalCompatibility?: Record<string, number>;
  healthCompatibility?: Record<string, number>;
  foodStyle?: string[];
  flexibility?: 'high' | 'moderate' | 'strict';
  requiresProfessionalReview?: string[];
  restrictions?: string[];
}

export type ComplianceStatus = 'SAFE' | 'CAUTION' | 'LIMIT' | 'AVOID' | 'PROFESSIONAL_REVIEW';

export interface DietComplianceEvaluation {
  status: ComplianceStatus;
  isCompatible?: boolean;
  isViolation?: boolean;
  tag: string;
  badgeVariant: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo';
  clinicalFeedback: string;
  recommendation: string;
  alternativeSuggestions: string[];
  professionalReviewRequired?: boolean;
  portionG?: number;
  nutrition?: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sodium_mg: number;
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

// ==================== PERSONALIZED RECOMMENDATION & 7-DAY PLAN TYPES ====================

export interface DietMatchScore {
  slug: string;
  name: string;
  tagline: string;
  icon: string;
  score: number; // 0 - 100
  tier: 'Best Match' | 'Good Match' | 'Alternative';
  macroRatio: { protein: number; carbs: number; fat: number };
  reasons: string[];
  cautionReasons: string[];
  requiresDoctorConsult: boolean;
  doctorConsultReasons: string[];
}

export interface PersonalizedMealItem {
  id: string;
  foodId: string;
  name: string;
  bengaliName?: string;
  portion: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  substitutionGroup: string;
  notes?: string;
}

export interface PersonalizedMealSlot {
  mealType: MealType;
  title: string;
  time: string;
  items: PersonalizedMealItem[];
  slotCalories: number;
  slotProtein: number;
  slotCarbs: number;
  slotFat: number;
  slotFiber: number;
}

export interface PersonalizedMealDay {
  dayNumber: number; // 1 to 7
  dayName: string; // e.g. "Day 1 (Monday)"
  focusTitle: string;
  meals: PersonalizedMealSlot[];
  dayCalories: number;
  dayProtein: number;
  dayCarbs: number;
  dayFat: number;
  dayFiber: number;
}

export interface FoodSwapOption {
  foodId: string;
  name: string;
  bengaliName: string;
  portion: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  reason: string;
}

export interface PersonalizedDietPlan {
  id: string;
  createdAt: string;
  summary: {
    bmi: number;
    bmiCategory: string;
    currentWeightKg: number;
    targetWeightKg: number;
    weightDifferenceKg: number;
    bmr: number;
    tdee: number;
    targetCalories: number;
    targetProteinG: number;
    targetCarbsG: number;
    targetFatG: number;
    targetFiberG: number;
    targetWaterMl: number;
    paceLabel: string;
  };
  topMatches: DietMatchScore[];
  selectedDiet: DietMatchScore;
  safetyAlerts: {
    requiresDoctorConsult: boolean;
    messages: string[];
  };
  behavioralTips: string[];
  sevenDayPlan: PersonalizedMealDay[];
}

export interface AdaptivePlanReview {
  weightChangeKg: number;
  status: 'optimal_progress' | 'slower_progress' | 'rapid_loss' | 'high_hunger' | 'low_energy';
  headline: string;
  recommendations: string[];
  adjustedCalories?: number;
  adjustedProteinG?: number;
  adjustedFiberG?: number;
}

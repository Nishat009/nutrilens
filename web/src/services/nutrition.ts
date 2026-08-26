import { ActivityLevel, Gender, GoalType, UserGoal, UserProfile } from '../lib/types';
import { ACTIVITY_LEVEL_MULTIPLIERS, GOAL_OPTIONS } from '../lib/constants';

export interface CalculatedNutritionSummary {
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese';
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
  targetWaterMl: number;
}

export function calculateAge(dobString: string): number {
  const birth = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(16, age || 25);
}

export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; category: CalculatedNutritionSummary['bmiCategory'] } {
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let category: CalculatedNutritionSummary['bmiCategory'] = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  return { bmi, category };
}

export function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  // Mifflin-St Jeor Equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') {
    return Math.round(base - 161);
  }
  return Math.round(base + 5);
}

export function calculateNutritionTargets(
  profile: Pick<UserProfile, 'gender' | 'dob' | 'heightCm' | 'weightKg' | 'activityLevel'>,
  goalType: GoalType
): CalculatedNutritionSummary {
  const age = calculateAge(profile.dob);
  const { bmi, category: bmiCategory } = calculateBMI(profile.weightKg, profile.heightCm);
  const bmr = calculateBMR(profile.gender, profile.weightKg, profile.heightCm, age);
  
  const multiplier = ACTIVITY_LEVEL_MULTIPLIERS[profile.activityLevel] || 1.375;
  const tdee = Math.round(bmr * multiplier);
  
  const goalConfig = GOAL_OPTIONS[goalType];
  const targetCalories = Math.max(1200, Math.round(tdee + goalConfig.calorieOffset));

  // Macronutrient breakdown
  // Protein: High protein focus (approx 2.0g per kg for goal optimization)
  let proteinMultiplier = 1.8;
  if (goalType === 'gain_muscle') proteinMultiplier = 2.2;
  else if (goalType === 'lose_weight') proteinMultiplier = 2.0;

  const targetProteinG = Math.round(profile.weightKg * proteinMultiplier);
  const proteinCalories = targetProteinG * 4;

  // Fat: 25% of total calories (9 kcal/g)
  const fatCalories = targetCalories * 0.25;
  const targetFatG = Math.round(fatCalories / 9);

  // Carbs: Remaining calories (4 kcal/g)
  const remainingCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const targetCarbsG = Math.round(remainingCalories / 4);

  // Fiber: approx 14g per 1000 kcal
  const targetFiberG = Math.round((targetCalories / 1000) * 14);

  // Water: ~35ml per kg body weight + active bonus
  const activeBonus = profile.activityLevel === 'very_active' || profile.activityLevel === 'extra_active' ? 750 : 300;
  const targetWaterMl = Math.round(profile.weightKg * 35 + activeBonus);

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    targetFiberG,
    targetWaterMl,
  };
}

export function generateUserGoalFromProfile(
  userId: string,
  profile: Pick<UserProfile, 'gender' | 'dob' | 'heightCm' | 'weightKg' | 'activityLevel'>,
  goalType: GoalType
): UserGoal {
  const calc = calculateNutritionTargets(profile, goalType);
  return {
    id: 'goal_' + Math.random().toString(36).substring(2, 9),
    userId,
    type: goalType,
    targetCalories: calc.targetCalories,
    targetProteinG: calc.targetProteinG,
    targetCarbsG: calc.targetCarbsG,
    targetFatG: calc.targetFatG,
    targetFiberG: calc.targetFiberG,
    targetWaterMl: calc.targetWaterMl,
    weeklyWeightChangeKg: goalType === 'lose_weight' ? -0.5 : goalType === 'gain_muscle' ? 0.25 : 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

export interface HydrationDetails {
  targetMl: number;
  targetLiters: number;
  glassesCount: number; // 250ml glasses
  guidanceText: string;
}

/**
 * Calculates personalized hydration requirements based on weight, height, and activity level.
 */
export function calculateHydration(
  weightKg: number,
  heightCm: number,
  activityLevel: ActivityLevel = 'moderately_active'
): HydrationDetails {
  let baseMl = weightKg * 35; // 35ml per kg body weight
  if (heightCm > 180) baseMl += 200;

  if (activityLevel === 'very_active' || activityLevel === 'extra_active') {
    baseMl += 800;
  } else if (activityLevel === 'moderately_active') {
    baseMl += 400;
  }

  const targetMl = Math.round(baseMl);
  const targetLiters = Math.round((targetMl / 1000) * 10) / 10;
  const glassesCount = Math.round(targetMl / 250);

  let guidanceText = 'Drink 1 glass upon waking, 1 glass 30m before meals, and replenish throughout the day.';
  if (targetLiters >= 3.0) {
    guidanceText = 'High metabolic demand: Spread intake evenly across your morning and active workout windows.';
  }

  return {
    targetMl,
    targetLiters,
    glassesCount,
    guidanceText,
  };
}

export interface ExercisePrescription {
  recommendedDailyMinutes: number;
  primaryWorkoutType: string;
  neatAlternatives: Array<{ title: string; desc: string; caloriesBurned: string; icon: string }>;
}

/**
 * Generates personalized daily workout duration and NEAT (Non-Exercise Activity) alternatives for busy schedules.
 */
export function calculateExerciseAndNeat(
  goalType: GoalType,
  activityLevel: ActivityLevel = 'moderately_active'
): ExercisePrescription {
  let recommendedDailyMinutes = 30;
  let primaryWorkoutType = '30 mins Moderate Cardio / Resistance Training';

  if (goalType === 'lose_weight') {
    recommendedDailyMinutes = 40;
    primaryWorkoutType = '40 mins Circuit / Fat-Burn Intervals + 3x Weekly Strength';
  } else if (goalType === 'gain_muscle') {
    recommendedDailyMinutes = 45;
    primaryWorkoutType = '45-60 mins Hypertrophy Resistance Training (Push/Pull/Legs)';
  } else {
    recommendedDailyMinutes = 30;
    primaryWorkoutType = '30 mins Cardiovascular Maintenance & Functional Mobility';
  }

  const neatAlternatives = [
    {
      title: '8,000 - 10,000 Brisk Steps',
      desc: 'Walking throughout the day keeps metabolism elevated and burns fat with zero gym fatigue.',
      caloriesBurned: '~300 - 400 kcal',
      icon: 'Footprints',
    },
    {
      title: '15-Min Post-Meal Walks',
      desc: 'A 15-minute stroll right after lunch and dinner reduces glucose spikes by up to 30%.',
      caloriesBurned: '~100 kcal',
      icon: 'Clock',
    },
    {
      title: 'Take Stairs & Hourly Standing Breaks',
      desc: 'Avoid prolonged sitting. Standing 5 mins every hour and taking stairs activates leg muscles.',
      caloriesBurned: '~150 kcal',
      icon: 'Activity',
    },
    {
      title: 'Active Household Chores / Bodyweight Squats',
      desc: '10 mins of cleaning, stretching, or 20 bodyweight squats between work sessions.',
      caloriesBurned: '~120 kcal',
      icon: 'Sparkles',
    },
  ];

  return {
    recommendedDailyMinutes,
    primaryWorkoutType,
    neatAlternatives,
  };
}

export interface WeightProjectionResult {
  dailyDeficit: number; // Positive = deficit, Negative = surplus
  projected30DayChangeKg: number; // E.g. -2.1 kg
  projectedWeightIn30DaysKg: number;
  status: 'optimal_deficit' | 'mild_deficit' | 'maintenance' | 'surplus' | 'fasting';
  statusLabel: string;
  statusAdvice: string;
}

/**
 * Projects 30-day weight loss based on actual daily calorie intake vs target TDEE.
 * Rule: ~7,700 kcal deficit = 1 kg fat loss.
 */
export function calculate30DayWeightProjection(
  currentWeightKg: number,
  tdee: number,
  targetCalories: number,
  consumedCalories: number
): WeightProjectionResult {
  // If consumed is 0, user hasn't logged today yet -> project based on planned target vs TDEE
  const actualCalories = consumedCalories > 0 ? consumedCalories : targetCalories;
  const dailyDeficit = tdee - actualCalories;
  const projected30DayChangeKg = Math.round(((actualCalories - tdee) * 30 / 7700) * 10) / 10;
  const projectedWeightIn30DaysKg = Math.round((currentWeightKg + projected30DayChangeKg) * 10) / 10;

  let status: WeightProjectionResult['status'] = 'optimal_deficit';
  let statusLabel = 'Optimal Fat Burning Zone';
  let statusAdvice = 'You are maintaining an ideal deficit for steady, healthy fat loss without muscle loss.';

  if (dailyDeficit >= 750) {
    status = 'optimal_deficit';
    statusLabel = 'Accelerated Fat Loss';
    statusAdvice = 'High deficit. Ensure adequate protein intake (minimum 1.8g/kg) to protect lean mass.';
  } else if (dailyDeficit >= 300) {
    status = 'optimal_deficit';
    statusLabel = 'Sustainable Deficit';
    statusAdvice = 'Perfect pace for long-term sustainable fat loss and healthy metabolic rate.';
  } else if (dailyDeficit >= -100 && dailyDeficit < 300) {
    status = 'maintenance';
    statusLabel = 'Weight Maintenance';
    statusAdvice = 'Your caloric intake matches your expenditure. Weight will remain stable.';
  } else {
    status = 'surplus';
    statusLabel = 'Calorie Surplus';
    statusAdvice = 'Consuming more calories than burning. Take a 20-min brisk walk to balance your energy budget.';
  }

  return {
    dailyDeficit,
    projected30DayChangeKg,
    projectedWeightIn30DaysKg,
    status,
    statusLabel,
    statusAdvice,
  };
}

import { MOCK_DIETS } from '../data/mock/diets';

export interface DietComplianceEvaluation {
  isCompatible: boolean;
  isViolation: boolean;
  tag: string;
  badgeVariant: 'emerald' | 'amber' | 'rose';
  clinicalFeedback: string;
  recommendation: string;
  alternativeSuggestions: string[];
}

/**
 * Validates a food against the user's active diet plan with clinical nutritionist reasoning.
 */
export function checkDietPlanCompatibility(
  foodName: string,
  category: string,
  activeDietName?: string
): DietComplianceEvaluation {
  if (!activeDietName) {
    return {
      isCompatible: true,
      isViolation: false,
      tag: '✅ Nutritious Whole Food',
      badgeVariant: 'emerald',
      clinicalFeedback: 'Wholesome natural food source supporting overall health.',
      recommendation: 'Incorporate as part of a balanced nutritional plate.',
      alternativeSuggestions: [],
    };
  }

  const nameLower = foodName.toLowerCase();
  const matchedDiet =
    MOCK_DIETS.find(
      (d) =>
        d.name.toLowerCase() === activeDietName.toLowerCase() ||
        d.slug.toLowerCase() === activeDietName.toLowerCase()
    ) || MOCK_DIETS[0];

  const forbiddenWords = matchedDiet.forbiddenKeywords || [];

  // Check if any forbidden keyword matches
  const matchedForbidden = forbiddenWords.find((keyword) => nameLower.includes(keyword.toLowerCase()));

  if (matchedForbidden) {
    // Determine diet-specific violation message
    if (matchedDiet.slug === 'ketogenic') {
      return {
        isCompatible: false,
        isViolation: true,
        tag: '🚫 Keto Protocol Violation',
        badgeVariant: 'rose',
        clinicalFeedback: `"${foodName}" is high in net carbohydrates and will kick your body out of nutritional ketosis.`,
        recommendation: 'Replace with low-carb leafy greens or healthy fat sources.',
        alternativeSuggestions: ['Steamed Broccoli', 'Cauliflower Rice', 'Sautéed Spinach', 'Hass Avocado'],
      };
    }

    if (matchedDiet.slug === 'plant-based') {
      return {
        isCompatible: false,
        isViolation: true,
        tag: '🚫 Non-Plant Food Alert',
        badgeVariant: 'rose',
        clinicalFeedback: `"${foodName}" contains animal-derived ingredients which are not permitted on the Whole-Food Plant-Based protocol.`,
        recommendation: 'Opt for plant protein and botanical alternatives.',
        alternativeSuggestions: ['Organic Tofu', 'Boiled Chickpeas (Chola)', 'Lentil Dal', 'Edamame'],
      };
    }

    if (matchedDiet.slug === 'low-gi-diabetes') {
      return {
        isCompatible: false,
        isViolation: true,
        tag: '⚠️ High Glycemic Spike Alert',
        badgeVariant: 'amber',
        clinicalFeedback: `"${foodName}" has a high Glycemic Index (>60) that can trigger rapid post-meal blood sugar surges.`,
        recommendation: 'Switch to slow-digesting resistant starches or high-fiber vegetables.',
        alternativeSuggestions: ['Steel-Cut Oats', 'Boiled Bitter Gourd (Karela)', 'Pointed Gourd (Potol)', 'Chia Seeds'],
      };
    }

    if (matchedDiet.slug === 'dash') {
      return {
        isCompatible: false,
        isViolation: true,
        tag: '⚠️ High Sodium / Pressure Warning',
        badgeVariant: 'amber',
        clinicalFeedback: `"${foodName}" contains elevated sodium levels that counter DASH arterial relaxation goals.`,
        recommendation: 'Choose unsalted potassium-rich fresh produce.',
        alternativeSuggestions: ['Fresh Beetroot Salad', 'Steamed Spinach', 'Raw Almonds', 'Sweet Potato Cubes'],
      };
    }

    return {
      isCompatible: false,
      isViolation: true,
      tag: `⚠️ Non-Compliant for ${matchedDiet.name}`,
      badgeVariant: 'amber',
      clinicalFeedback: `"${foodName}" contains ultra-processed elements or excessive refined sugars not recommended on ${matchedDiet.name}.`,
      recommendation: 'Select whole-food unrefined ingredients instead.',
      alternativeSuggestions: ['Fresh Rainbow Vegetables', 'Grilled Clean Protein', 'Extra Virgin Olive Oil'],
    };
  }

  // If compatible:
  return {
    isCompatible: true,
    isViolation: false,
    tag: `✅ ${matchedDiet.name} Approved`,
    badgeVariant: 'emerald',
    clinicalFeedback: `"${foodName}" aligns with your ${matchedDiet.name} protocol, supplying beneficial micronutrients and satiety.`,
    recommendation: 'Great choice! Track your portion accurately.',
    alternativeSuggestions: [],
  };
}


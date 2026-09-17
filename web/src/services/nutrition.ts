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
import { DietComplianceEvaluation, ComplianceStatus } from '../lib/types';

/**
 * Validates a food against the user's active diet plan and medical profile with clinical nutritionist reasoning.
 */
export function checkDietPlanCompatibility(
  foodName: string,
  category: string,
  activeDietName?: string,
  portionG: number = 100,
  medicalConditions: string[] = [],
  allergies: string[] = []
): DietComplianceEvaluation {
  const nameLower = foodName.toLowerCase();
  const conditionsLower = (medicalConditions || []).map((c) => c.toLowerCase().trim());
  const allergiesLower = (allergies || []).map((a) => a.toLowerCase().trim());

  const matchedDiet =
    MOCK_DIETS.find(
      (d) =>
        d.id === activeDietName ||
        d.name.toLowerCase() === (activeDietName || '').toLowerCase() ||
        d.slug.toLowerCase() === (activeDietName || '').toLowerCase()
    ) || MOCK_DIETS[0];

  // 1. Allergy Check (Immediate AVOID)
  if (allergiesLower.length > 0) {
    if (allergiesLower.some((a) => nameLower.includes(a) || (a === 'peanuts' && nameLower.includes('badam')))) {
      return {
        status: 'AVOID',
        isCompatible: false,
        isViolation: true,
        tag: '🚫 Allergen Conflict Alert',
        badgeVariant: 'rose',
        clinicalFeedback: `"${foodName}" contains verified allergens in your profile. Strict avoidance is advised.`,
        recommendation: 'Do not consume. Select allergen-free alternatives.',
        alternativeSuggestions: ['Safe Whole Vegetables', 'Non-Allergenic Proteins'],
        portionG,
      };
    }
  }

  // 2. CKD / Renal Check (Aggressive Professional Review)
  if (conditionsLower.some((c) => c.includes('ckd') || c.includes('kidney'))) {
    if (category.toLowerCase().includes('meat') || category.toLowerCase().includes('poultry') || nameLower.includes('chicken breast')) {
      return {
        status: 'PROFESSIONAL_REVIEW',
        isCompatible: false,
        isViolation: false,
        tag: '🏥 Professional Review Recommended',
        badgeVariant: 'indigo',
        clinicalFeedback: 'NutriLens cannot safely determine automated suitability for high-protein foods in CKD without clinical lab context (eGFR, stage).',
        recommendation: 'Consult your treating nephrologist or clinical renal dietitian.',
        alternativeSuggestions: ['Consult Healthcare Provider for Individualized Protein Target'],
        professionalReviewRequired: true,
        portionG,
      };
    }
  }

  // 3. Diabetes / Prediabetes + White Rice / Refined Carbs (CAUTION default, LIMIT if large portion)
  if (conditionsLower.some((c) => c.includes('diabet') || c.includes('insulin'))) {
    if (nameLower.includes('white rice') || nameLower.includes('bhaat') || nameLower.includes('rice') && !nameLower.includes('red') && !nameLower.includes('brown')) {
      if (portionG >= 200) {
        return {
          status: 'LIMIT',
          isCompatible: false,
          isViolation: true,
          tag: '⚠️ High Glycemic Load (Large Portion)',
          badgeVariant: 'orange',
          clinicalFeedback: `A ${portionG}g serving of cooked white rice carries a high glycemic load. Consider reducing to 100-120g or pairing with non-starchy greens.`,
          recommendation: 'Scale down portion or substitute with Red rice (Lal chal) / Steel-cut oats.',
          alternativeSuggestions: ['Red Rice (Lal chal)', 'Palong Shak', 'Chickpeas / Dal', 'Steel-cut Oats'],
          portionG,
        };
      }
      return {
        status: 'CAUTION',
        isCompatible: true,
        isViolation: false,
        tag: 'ℹ️ Mindful Portion & Plate Balance',
        badgeVariant: 'amber',
        clinicalFeedback: `Refined carbohydrate with potentially higher glycemic impact; portion (${portionG}g) and pairing with leafy greens/protein matter.`,
        recommendation: 'Enjoy mindfully; ensure half your plate has non-starchy vegetables.',
        alternativeSuggestions: ['Red Rice (Lal chal)', 'Lentil Dal', 'Steamed Vegetables'],
        portionG,
      };
    }
  }

  // 4. Gout / Hyperuricemia + Purine Food (CAUTION if small, LIMIT if large)
  if (conditionsLower.some((c) => c.includes('gout') || c.includes('uric'))) {
    if (nameLower.includes('fish') || nameLower.includes('rui') || nameLower.includes('meat') || nameLower.includes('beef') || nameLower.includes('mutton')) {
      if (nameLower.includes('beef') || nameLower.includes('liver') || nameLower.includes('kolija') || nameLower.includes('shutki')) {
        return {
          status: 'LIMIT',
          isCompatible: false,
          isViolation: true,
          tag: '⚠️ High Purine Density',
          badgeVariant: 'orange',
          clinicalFeedback: `"${foodName}" contains high purine density which degrades into uric acid. Moderation and high fluid intake are advised.`,
          recommendation: 'Choose low-purine proteins like whole boiled eggs or low-fat Tok doi.',
          alternativeSuggestions: ['Whole Boiled Eggs', 'Low-fat Tok doi (Yogurt)', 'Fresh Cucumber', 'Bottle Gourd (Lau)'],
          portionG,
        };
      }
      if (portionG > 120) {
        return {
          status: 'LIMIT',
          isCompatible: false,
          isViolation: true,
          tag: '⚠️ Moderate Purine (Large Serving)',
          badgeVariant: 'orange',
          clinicalFeedback: `Portion size (${portionG}g) supplies moderate purines. In active hyperuricemia, portions under 80-100g with ample water are recommended.`,
          recommendation: 'Scale portion down to ~80g and drink plenty of water.',
          alternativeSuggestions: ['Boiled Eggs', 'Low-fat Tok doi', 'Bottle Gourd curry'],
          portionG,
        };
      }
      return {
        status: 'CAUTION',
        isCompatible: true,
        isViolation: false,
        tag: 'ℹ️ Moderate Purine (Mind Hydration)',
        badgeVariant: 'amber',
        clinicalFeedback: `"${foodName}" has moderate purines. Enjoy with ample hydration (>3.0L daily).`,
        recommendation: 'Standard portion is acceptable alongside plenty of water.',
        alternativeSuggestions: ['Boiled Eggs', 'Low-fat Tok doi'],
        portionG,
      };
    }
  }

  // 5. Hypothyroidism + Goitrogens (Raw = CAUTION, Cooked = SAFE)
  if (conditionsLower.some((c) => c.includes('thyroid') || c.includes('hashimoto'))) {
    if (nameLower.includes('cabbage') || nameLower.includes('cauliflower') || nameLower.includes('broccoli')) {
      return {
        status: 'CAUTION',
        isCompatible: true,
        isViolation: false,
        tag: 'ℹ️ Cook Thoroughly (Goitrogen Care)',
        badgeVariant: 'amber',
        clinicalFeedback: `Raw cruciferous vegetables contain goitrogenic compounds; thorough cooking deactivates myrosinase and makes them safe.`,
        recommendation: 'Ensure vegetables are well-cooked or steamed before eating.',
        alternativeSuggestions: ['Cooked Spinach (Palong Shak)', 'Bottle Gourd (Lau)', 'Sea Fish (Rupchanda)'],
        portionG,
      };
    }
  }

  // 6. Active Diet Plan Forbidden Words Check
  const forbiddenWords = matchedDiet.forbiddenKeywords || [];
  const matchedForbidden = forbiddenWords.find((keyword) => nameLower.includes(keyword.toLowerCase()));

  if (matchedForbidden) {
    if (matchedDiet.slug.includes('keto')) {
      return {
        status: 'LIMIT',
        isCompatible: false,
        isViolation: true,
        tag: '🚫 Keto Carbohydrate Limit',
        badgeVariant: 'orange',
        clinicalFeedback: `"${foodName}" is high in net carbohydrates and may interrupt nutritional ketosis.`,
        recommendation: 'Replace with low-carb leafy greens or healthy deshi fats.',
        alternativeSuggestions: ['Palong Shak', 'Cauliflower Rice', 'Pure Deshi Ghee', 'Boiled Eggs'],
        portionG,
      };
    }

    return {
      status: 'LIMIT',
      isCompatible: false,
      isViolation: true,
      tag: `⚠️ Limited on ${matchedDiet.name}`,
      badgeVariant: 'orange',
      clinicalFeedback: `"${foodName}" contains elements not encouraged on the ${matchedDiet.name} protocol.`,
      recommendation: 'Select whole-food unrefined ingredients instead.',
      alternativeSuggestions: ['Fresh Leafy Greens', 'Deshi Fish / Chicken', 'Cold-pressed Mustard Oil'],
      portionG,
    };
  }

  // 7. Default SAFE Status
  return {
    status: 'SAFE',
    isCompatible: true,
    isViolation: false,
    tag: `✅ ${matchedDiet.name} Approved`,
    badgeVariant: 'emerald',
    clinicalFeedback: `"${foodName}" aligns well with your ${matchedDiet.name} protocol, supplying valuable micronutrients and satiety.`,
    recommendation: 'Nutritious choice! Track your portion accurately.',
    alternativeSuggestions: [],
    portionG,
  };
}




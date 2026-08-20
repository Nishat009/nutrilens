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

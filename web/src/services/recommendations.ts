import { DailyNutrition, Recommendation, UserGoal, UserProfile } from '../lib/types';

export function generateDynamicRecommendations(
  profile: UserProfile,
  goal: UserGoal,
  todayNutrition: DailyNutrition
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const calorieRemaining = goal.targetCalories - todayNutrition.totalCalories;
  const proteinRemaining = goal.targetProteinG - todayNutrition.totalProtein;
  const waterRemaining = goal.targetWaterMl - todayNutrition.waterIntakeMl;

  // Protein advice
  if (proteinRemaining > 30) {
    recommendations.push({
      id: 'rec_prot_' + Date.now(),
      title: 'Boost Evening Protein',
      category: 'nutrition',
      message: `You are ${Math.round(proteinRemaining)}g away from your protein target. Consider Greek yogurt, salmon, or a whey protein shake with your next meal.`,
      severity: 'info',
      actionText: 'Browse High-Protein Diets',
      actionUrl: '/diets/mediterranean',
      createdAt: new Date().toISOString(),
    });
  } else if (todayNutrition.totalProtein >= goal.targetProteinG) {
    recommendations.push({
      id: 'rec_prot_hit_' + Date.now(),
      title: 'Protein Target Crushed! 🎉',
      category: 'nutrition',
      message: `You have hit your daily protein goal (${todayNutrition.totalProtein}g). Your muscles have all the amino acids required for repair.`,
      severity: 'success',
      createdAt: new Date().toISOString(),
    });
  }

  // Hydration advice
  if (waterRemaining > 1000) {
    recommendations.push({
      id: 'rec_water_' + Date.now(),
      title: 'Hydration Deficit Alert',
      category: 'hydration',
      message: `You've logged ${todayNutrition.waterIntakeMl} ml of water. Aim to drink a 500ml glass before dinner to boost digestion and satiety.`,
      severity: 'warning',
      createdAt: new Date().toISOString(),
    });
  }

  // Calorie pacing
  if (calorieRemaining > 600 && new Date().getHours() >= 18) {
    recommendations.push({
      id: 'rec_cal_pace_' + Date.now(),
      title: 'Energy Reserve Available',
      category: 'goal_pacing',
      message: `You have ${calorieRemaining} kcal remaining for today. A nutrient-dense dinner with complex carbs and healthy fats will keep your recovery optimal.`,
      severity: 'info',
      actionText: 'Plan Dinner',
      actionUrl: '/planner',
      createdAt: new Date().toISOString(),
    });
  }

  return recommendations;
}

import { DailyNutrition, WeightLog } from '../../lib/types';

// Generate 30 days of realistic progress data
export function generateProgressData() {
  const weightLogs: WeightLog[] = [];
  const dailyHistory: DailyNutrition[] = [];
  
  let currentWeight = 76.2;
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    // Gradual weight loss with natural daily fluctuation
    const fluctuation = (Math.random() - 0.5) * 0.3;
    const trend = -0.055; // downward slope
    currentWeight = Math.max(73.5, Math.round((currentWeight + trend + fluctuation) * 10) / 10);

    weightLogs.push({
      id: `w_log_${dateStr}`,
      date: dateStr,
      weightKg: currentWeight,
      notes: i % 7 === 0 ? 'Weekly check-in' : undefined,
    });

    const targetCal = 2150;
    const calFluct = Math.floor((Math.random() - 0.4) * 200);
    const calories = targetCal + calFluct;
    const protein = Math.floor(150 + Math.random() * 25);
    const carbs = Math.floor(190 + Math.random() * 40);
    const fat = Math.floor(55 + Math.random() * 15);
    const fiber = Math.floor(28 + Math.random() * 8);

    dailyHistory.push({
      date: dateStr,
      totalCalories: calories,
      totalProtein: protein,
      totalCarbs: carbs,
      totalFat: fat,
      totalFiber: fiber,
      waterIntakeMl: 2200 + Math.floor(Math.random() * 1000),
      mealsLoggedCount: 3 + (Math.random() > 0.5 ? 1 : 0),
    });
  }

  return { weightLogs, dailyHistory };
}

export const { weightLogs: MOCK_WEIGHT_LOGS, dailyHistory: MOCK_DAILY_HISTORY } = generateProgressData();

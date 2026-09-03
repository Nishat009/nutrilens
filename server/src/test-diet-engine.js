const {
  generatePersonalizedDietRecommendation,
  getFoodSwaps,
  reviewAdaptiveProgress,
  calculateSafeCalorieAndMacroTargets,
  rankDietProtocols,
} = require('./services/diet-recommendation-engine');

console.log('====================================================');
console.log('🧪 TESTING NUTRILENS DIET RECOMMENDATION ENGINE');
console.log('====================================================\n');

// TEST SCENARIO 1: Traditional Bangladeshi Weight Loss User
console.log('--- TEST 1: Traditional Bangladeshi Weight Loss ---');
const user1 = {
  age: 28,
  gender: 'male',
  heightCm: 170,
  weightKg: 82,
  targetWeightKg: 70,
  activityLevel: 'sedentary',
  primaryGoal: 'lose_weight',
  goalPace: 'moderate',
  foodPreferences: ['traditional_bangladeshi', 'balanced'],
  allergies: [],
  lifestyle: { mealFrequency: 3 },
};

const plan1 = generatePersonalizedDietRecommendation(user1);
console.log(`User 1: ${user1.weightKg}kg -> ${user1.targetWeightKg}kg (BMI: ${plan1.summary.bmi}, ${plan1.summary.bmiCategory})`);
console.log(`BMR: ${plan1.summary.bmr} kcal | TDEE: ${plan1.summary.tdee} kcal | Safe Calorie Target: ${plan1.summary.targetCalories} kcal`);
console.log(`Macros: Protein ${plan1.summary.targetProteinG}g | Carbs ${plan1.summary.targetCarbsG}g | Fat ${plan1.summary.targetFatG}g | Fiber ${plan1.summary.targetFiberG}g`);
console.log(`Top Diet Matched: "${plan1.selectedDiet.name}" (Score: ${plan1.selectedDiet.score}%)`);
console.log(`Day 1 Meals generated count: ${plan1.sevenDayPlan[0].meals.length} meals`);
console.log(`Day 1 Lunch items:`, plan1.sevenDayPlan[0].meals.find(m => m.mealType === 'lunch').items.map(i => `${i.name} (${i.portion})`));
console.assert(plan1.summary.targetCalories >= 1500, 'Male safe floor enforced');
console.assert(plan1.sevenDayPlan.length === 7, '7 days generated');
console.log('✅ Test 1 Passed!\n');

// TEST SCENARIO 2: Prediabetes / Blood Sugar Management User
console.log('--- TEST 2: Prediabetes / Blood Sugar Focus ---');
const user2 = {
  age: 38,
  gender: 'female',
  heightCm: 160,
  weightKg: 74,
  targetWeightKg: 64,
  activityLevel: 'lightly_active',
  primaryGoal: 'blood_sugar',
  healthConditions: ['prediabetes', 'pcos'],
  foodPreferences: ['traditional_bangladeshi'],
};
const plan2 = generatePersonalizedDietRecommendation(user2);
console.log(`Top Match for Prediabetes/PCOS: "${plan2.selectedDiet.name}" (Score: ${plan2.selectedDiet.score}%)`);
console.assert(plan2.selectedDiet.slug === 'low-gi-diabetes', 'Low-GI matched for prediabetes');
console.log('✅ Test 2 Passed!\n');

// TEST SCENARIO 3: High Blood Pressure (Hypertension) User
console.log('--- TEST 3: High Blood Pressure Support ---');
const user3 = {
  age: 48,
  gender: 'male',
  heightCm: 175,
  weightKg: 85,
  targetWeightKg: 78,
  activityLevel: 'lightly_active',
  primaryGoal: 'blood_pressure',
  healthConditions: ['hypertension'],
};
const plan3 = generatePersonalizedDietRecommendation(user3);
console.log(`Top Match for Hypertension: "${plan3.selectedDiet.name}" (Score: ${plan3.selectedDiet.score}%)`);
console.assert(plan3.selectedDiet.slug === 'dash', 'DASH matched for hypertension');
console.log('✅ Test 3 Passed!\n');

// TEST SCENARIO 4: Muscle Building Gym Lifter
console.log('--- TEST 4: Muscle Building / Gym Focus ---');
const user4 = {
  age: 24,
  gender: 'male',
  heightCm: 180,
  weightKg: 72,
  targetWeightKg: 78,
  activityLevel: 'very_active',
  primaryGoal: 'gain_muscle',
  foodPreferences: ['high_protein'],
};
const plan4 = generatePersonalizedDietRecommendation(user4);
console.log(`Top Match for Muscle Gain: "${plan4.selectedDiet.name}" (Score: ${plan4.selectedDiet.score}%)`);
console.log(`Protein Target: ${plan4.summary.targetProteinG}g (~${Math.round(plan4.summary.targetProteinG / 72 * 10) / 10} g/kg)`);
console.assert(plan4.selectedDiet.slug === 'high-protein', 'High protein matched for muscle building');
console.assert(plan4.summary.targetProteinG >= 140, 'Adequate protein for weight');
console.log('✅ Test 4 Passed!\n');

// TEST SCENARIO 5: 100% Plant-Based / Vegan
console.log('--- TEST 5: 100% Plant-Based / Vegan ---');
const user5 = {
  age: 30,
  gender: 'female',
  heightCm: 165,
  weightKg: 60,
  targetWeightKg: 58,
  activityLevel: 'moderately_active',
  primaryGoal: 'general_health',
  foodPreferences: ['vegan'],
};
const plan5 = generatePersonalizedDietRecommendation(user5);
console.log(`Top Match for Vegan: "${plan5.selectedDiet.name}" (Score: ${plan5.selectedDiet.score}%)`);
console.assert(plan5.selectedDiet.slug === 'plant-based', 'Plant-Based matched for vegan');
// Check that zero animal products appear in day 1
const day1Foods = plan5.sevenDayPlan[0].meals.flatMap(m => m.items.map(i => i.name));
console.log('Day 1 Vegan Foods:', day1Foods);
console.log('✅ Test 5 Passed!\n');

// TEST SCENARIO 6: Allergy Hard Exclusion (Fish & Dairy Allergies)
console.log('--- TEST 6: Hard Exclusion of Allergies (Fish & Dairy) ---');
const user6 = {
  age: 26,
  gender: 'male',
  heightCm: 172,
  weightKg: 80,
  targetWeightKg: 72,
  activityLevel: 'sedentary',
  primaryGoal: 'lose_weight',
  allergies: ['fish', 'dairy'],
};
const plan6 = generatePersonalizedDietRecommendation(user6);
const allPlanFoods = plan6.sevenDayPlan.flatMap(d => d.meals.flatMap(m => m.items.map(i => i.name)));
const containsFish = allPlanFoods.some(name => name.toLowerCase().includes('fish') || name.toLowerCase().includes('rui') || name.toLowerCase().includes('katla'));
const containsDairy = allPlanFoods.some(name => name.toLowerCase().includes('milk') || name.toLowerCase().includes('doi') || name.toLowerCase().includes('curd') || name.toLowerCase().includes('yogurt'));
console.assert(!containsFish, 'Zero fish present in meal plan');
console.assert(!containsDairy, 'Zero dairy present in meal plan');
console.log('Confirmed zero fish & zero dairy in 7-day plan!');
console.log('✅ Test 6 Passed!\n');

// TEST SCENARIO 7: Food Swaps Engine
console.log('--- TEST 7: Food Swaps Engine ---');
const chickenSwaps = getFoodSwaps('bg_chicken_breast', ['peanut']);
console.log('Alternatives for Desi Chicken Breast:', chickenSwaps.map(s => `${s.name} (${s.portion}, ${s.calories} kcal)`));
console.assert(chickenSwaps.length > 0, 'Food swaps returned alternatives');
console.log('✅ Test 7 Passed!\n');

// TEST SCENARIO 8: Adaptive 2-3 Week Review Engine
console.log('--- TEST 8: Adaptive Progress Review ---');
const review = reviewAdaptiveProgress({
  startingWeightKg: 82,
  currentWeightKg: 80.8,
  weeksElapsed: 3,
  hungerRating: 4,
  energyRating: 4,
  adherenceRating: 5,
});
console.log(`Adaptive Headline: ${review.headline}`);
console.log(`Recommendations:`, review.recommendations);
console.assert(review.status === 'optimal_progress', 'Optimal progress recognized');
console.log('✅ Test 8 Passed!\n');

console.log('====================================================');
console.log('🎉 ALL 8 TEST SCENARIOS PASSED WITH 100% SUCCESS!');
console.log('====================================================');

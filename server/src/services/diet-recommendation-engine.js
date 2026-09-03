const { DIETS_DATA } = require('../data/diet-plans');
const { BANGLADESHI_FOODS } = require('../data/bangladeshi-foods');

/**
 * 1. Age Calculation from Date of Birth string or numeric age
 */
function calculateAge(dobOrAge) {
  if (typeof dobOrAge === 'number' && dobOrAge > 0) return dobOrAge;
  if (!dobOrAge || typeof dobOrAge !== 'string') return 28;
  const birth = new Date(dobOrAge);
  if (isNaN(birth.getTime())) {
    const parsed = parseInt(dobOrAge, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 28;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(16, age || 28);
}

/**
 * 2. BMI Calculation (Screening / context metric, not medical diagnosis)
 */
function calculateBMI(weightKg, heightCm) {
  const heightM = Math.max(1, heightCm) / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let category = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25.0) category = 'Normal weight';
  else if (bmi < 30.0) category = 'Overweight';
  else category = 'Obese';
  return { bmi, category };
}

/**
 * 3. BMR using Mifflin-St Jeor Equation
 */
function calculateBMR(gender, weightKg, heightCm, age) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') {
    return Math.round(base - 161);
  }
  return Math.round(base + 5);
}

/**
 * 4. TDEE based on physical activity level
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

function calculateTDEE(bmr, activityLevel) {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  return Math.round(bmr * mult);
}

/**
 * 5. Safe Calorie Target & Macronutrient Breakdown
 */
function calculateSafeCalorieAndMacroTargets(userProfile, topDiet) {
  const age = calculateAge(userProfile.dob || userProfile.age);
  const gender = userProfile.gender || 'male';
  const heightCm = parseFloat(userProfile.heightCm) || 170;
  const weightKg = parseFloat(userProfile.weightKg) || 75;
  const targetWeightKg = parseFloat(userProfile.targetWeightKg) || weightKg;
  const activityLevel = userProfile.activityLevel || 'moderately_active';
  const goal = userProfile.primaryGoal || 'lose_weight';
  const pace = userProfile.goalPace || 'moderate';

  const { bmi, category: bmiCategory } = calculateBMI(weightKg, heightCm);
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel);

  // Calorie adjustments based on goal & pace
  let calorieOffset = 0;
  if (goal === 'lose_weight' || goal === 'reduce_belly_fat') {
    if (pace === 'slow_sustainable') calorieOffset = -300;
    else if (pace === 'faster' && bmi >= 25) calorieOffset = -600;
    else calorieOffset = -450; // moderate
  } else if (goal === 'gain_muscle') {
    calorieOffset = pace === 'slow_sustainable' ? 200 : 350;
  } else if (goal === 'body_recomposition') {
    calorieOffset = -200;
  } else {
    // maintain, general_health, blood_sugar, blood_pressure
    calorieOffset = 0;
  }

  // Enforce physiological safety floor
  const minSafeFloor = gender === 'female' ? 1200 : 1500;
  const targetCalories = Math.max(minSafeFloor, Math.round(tdee + calorieOffset));

  // Determine Macro Ratios (using Matched Diet as starting reference, adjusted for user goal)
  let macroRatio = { protein: 30, carbs: 45, fat: 25 };
  if (topDiet && topDiet.macroRatio) {
    macroRatio = { ...topDiet.macroRatio };
  }

  // If High Protein or Muscle Gain, ensure adequate protein floor (at least 1.8g/kg)
  let targetProteinG = Math.round((targetCalories * (macroRatio.protein / 100)) / 4);
  const minProteinForWeight = Math.round(weightKg * 1.6);
  if (targetProteinG < minProteinForWeight && topDiet.slug !== 'plant-based') {
    targetProteinG = minProteinForWeight;
  }

  // Calculate Fat & Carbs in grams
  const proteinCalories = targetProteinG * 4;
  let targetFatG = Math.round((targetCalories * (macroRatio.fat / 100)) / 9);
  const remainingCalories = Math.max(0, targetCalories - (proteinCalories + targetFatG * 9));
  let targetCarbsG = Math.round(remainingCalories / 4);

  // Fiber target: approx 14g per 1000 kcal
  const targetFiberG = Math.max(25, Math.round((targetCalories / 1000) * 14));

  // Hydration: 35ml per kg body weight + active bonus
  const activeBonus = activityLevel === 'very_active' || activityLevel === 'extra_active' ? 750 : 350;
  const targetWaterMl = Math.round(weightKg * 35 + activeBonus);

  return {
    bmi,
    bmiCategory,
    currentWeightKg: weightKg,
    targetWeightKg,
    weightDifferenceKg: Math.round((weightKg - targetWeightKg) * 10) / 10,
    bmr,
    tdee,
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    targetFiberG,
    targetWaterMl,
    paceLabel:
      pace === 'slow_sustainable'
        ? 'Slow & Sustainable (~0.25 - 0.5 kg/week)'
        : pace === 'faster'
        ? 'Moderate-Fast (~0.75 kg/week)'
        : 'Moderate & Balanced (~0.5 kg/week)',
  };
}

/**
 * 6. Diet Matching Engine: Ranks DIETS_DATA based on comprehensive user profile
 */
function rankDietProtocols(userProfile) {
  const goal = userProfile.primaryGoal || 'lose_weight';
  const conditions = userProfile.healthConditions || [];
  const preferences = userProfile.foodPreferences || [];
  const allergies = userProfile.allergies || [];
  const activity = userProfile.activityLevel || 'moderately_active';

  const scoredDiets = DIETS_DATA.map((diet) => {
    let score = 70; // baseline
    const reasons = [];
    const cautionReasons = [];
    const doctorConsultReasons = [];

    // 1. Goal compatibility (up to +20)
    if (diet.goalCompatibility && diet.goalCompatibility[goal]) {
      const goalScore = diet.goalCompatibility[goal];
      score += (goalScore - 70) * 0.4;
      if (goalScore >= 90) {
        reasons.push(`Directly supports your primary focus on ${formatGoalName(goal)}.`);
      }
    }

    // Direct targeted goal boost
    if (goal === 'blood_sugar' && diet.slug === 'low-gi-diabetes') {
      score += 15;
    } else if (goal === 'blood_pressure' && diet.slug === 'dash') {
      score += 15;
    } else if ((goal === 'gain_muscle' || goal === 'body_recomposition') && diet.slug === 'high-protein') {
      score += 15;
    } else if ((goal === 'general_health' || goal === 'maintain') && diet.slug === 'mediterranean') {
      score += 10;
    }

    // 2. Health conditions compatibility
    conditions.forEach((cond) => {
      if (diet.healthCompatibility && diet.healthCompatibility[cond]) {
        const condScore = diet.healthCompatibility[cond];
        score += (condScore - 70) * 0.3;
        if (condScore >= 92) {
          reasons.push(`Clinically favorable pattern for managing ${formatConditionName(cond)}.`);
        } else if (condScore <= 60) {
          cautionReasons.push(`Requires careful consideration or portion adjustments for ${formatConditionName(cond)}.`);
        }
      }

      // Targeted condition boost
      if ((cond === 'diabetes' || cond === 'prediabetes' || cond === 'pcos') && diet.slug === 'low-gi-diabetes') {
        score += 10;
      }
      if (cond === 'hypertension' && diet.slug === 'dash') {
        score += 10;
      }

      // Check if this condition requires medical consultation under this diet
      if (diet.requiresProfessionalReview && diet.requiresProfessionalReview.includes(cond)) {
        doctorConsultReasons.push(
          `For ${formatConditionName(cond)}, please consult a physician or clinical dietitian before starting ${diet.name}.`
        );
      }
    });

    // 3. Food preferences compatibility
    if (preferences.includes('vegan') || preferences.includes('vegetarian')) {
      if (diet.slug === 'plant-based') {
        score += 20;
        reasons.push('100% aligned with your botanical / plant-based dietary preference.');
      } else if (diet.slug === 'ketogenic' || diet.slug === 'high-protein') {
        score -= 25;
        cautionReasons.push('Heavily relies on animal proteins which conflicts with plant-based preference.');
      }
    }

    if (preferences.includes('low_carb')) {
      if (diet.slug === 'ketogenic') {
        score += 18;
        reasons.push('Matches your explicit preference for low-carbohydrate eating.');
      } else if (diet.slug === 'low-gi-diabetes') {
        score += 12;
        reasons.push('Provides controlled, slow-digesting complex carbohydrates.');
      }
    } else {
      // If user did NOT request low carb, heavily de-prioritize strict Keto
      if (diet.slug === 'ketogenic') {
        score -= 20;
        cautionReasons.push('Very restrictive (<30g carbs) and requires specific low-carb adherence.');
      }
    }

    if (preferences.includes('traditional_bangladeshi') || preferences.includes('balanced')) {
      if (diet.foodStyle && diet.foodStyle.includes('bangladeshi-friendly')) {
        score += 10;
        reasons.push('Seamlessly incorporates familiar Bangladeshi foods (rice portions, local fish, lentils, and seasonal greens).');
      }
    }

    if (preferences.includes('high_protein')) {
      if (diet.slug === 'high-protein') {
        score += 15;
        reasons.push('Optimized for high protein density to promote lean tissue repair.');
      }
    }

    // 4. Special medical safety checks
    if (conditions.includes('kidney_disease')) {
      if (diet.slug === 'high-protein' || diet.slug === 'ketogenic') {
        score -= 40;
        cautionReasons.push('High protein/ketogenic loads can place stress on impaired kidney function.');
        doctorConsultReasons.push('Renal conditions require strict individualized protein management by a nephrologist.');
      }
    }

    if (conditions.includes('pregnancy_breastfeeding')) {
      if (diet.slug === 'ketogenic' || diet.slug === 'intermittent-fasting') {
        score -= 40;
        cautionReasons.push('Ketosis and time-restricted fasting are not advised during pregnancy or breastfeeding.');
        doctorConsultReasons.push('Pregnancy requires adequate carbohydrate and nutrient density for fetal development.');
      }
    }

    // 5. Activity level compatibility
    if (activity === 'very_active' || activity === 'extra_active') {
      if (diet.slug === 'high-protein') {
        score += 8;
        reasons.push('Provides ample amino acids and glycogen replenishment for your high workout volume.');
      }
    }

    // Cap score between 35 and 99
    const finalScore = Math.min(99, Math.max(35, Math.round(score)));

    return {
      slug: diet.slug,
      name: diet.name,
      tagline: diet.tagline,
      icon: diet.icon,
      rawScore: score,
      score: Math.min(99, Math.max(35, Math.round(score))),
      macroRatio: diet.macroRatio,
      reasons: reasons.slice(0, 4),
      cautionReasons: cautionReasons.slice(0, 3),
      requiresDoctorConsult: doctorConsultReasons.length > 0,
      doctorConsultReasons,
    };
  });

  // Sort descending by rawScore
  scoredDiets.sort((a, b) => b.rawScore - a.rawScore);

  // Assign tiers
  scoredDiets.forEach((item, index) => {
    if (index === 0) item.tier = 'Best Match';
    else if (index <= 2) item.tier = 'Good Match';
    else item.tier = 'Alternative';
  });

  return scoredDiets;
}

function formatGoalName(goal) {
  const map = {
    lose_weight: 'Sustainable Weight Loss',
    reduce_belly_fat: 'Waist & Visceral Fat Reduction',
    gain_muscle: 'Lean Muscle Hypertrophy',
    body_recomposition: 'Body Recomposition',
    maintain: 'Healthy Weight Maintenance',
    general_health: 'Longevity & Vitality',
    blood_sugar: 'Blood Sugar Stability',
    blood_pressure: 'Cardiovascular Blood Pressure Support',
  };
  return map[goal] || 'Healthy Nutrition';
}

function formatConditionName(cond) {
  const map = {
    diabetes: 'Type 2 Diabetes',
    prediabetes: 'Prediabetes & Insulin Resistance',
    hypertension: 'High Blood Pressure (Hypertension)',
    pcos: 'PCOS / Hormonal Balance',
    thyroid: 'Thyroid Health',
    high_cholesterol: 'Lipid & Cholesterol Balance',
    fatty_liver: 'Fatty Liver Health',
    kidney_disease: 'Kidney Health',
    liver_disease: 'Liver Health',
    gerd: 'Gastric & Acid Reflux',
    ibs: 'Digestive & IBS Comfort',
    anemia: 'Iron & Anemia Support',
    pregnancy_breastfeeding: 'Pregnancy / Nursing',
  };
  return map[cond] || cond;
}

/**
 * 7. 7-Day Personalized Meal Plan Generator (with Bangladeshi adaptation, allergies hard exclusion, portion guides)
 */
function generate7DayMealPlan(userProfile, targetCalories, topDiet) {
  const allergies = userProfile.allergies || [];
  const preferences = userProfile.foodPreferences || [];
  const mealFrequency = userProfile.lifestyle?.mealFrequency || 3;
  const isBangladeshi = preferences.includes('traditional_bangladeshi') || preferences.length === 0;
  const isVegan = preferences.includes('vegan');
  const isVegetarian = preferences.includes('vegetarian') || isVegan;
  const isPescatarian = preferences.includes('pescatarian');
  const isLowCarb = topDiet.slug === 'ketogenic';

  // Filter safe food pool excluding user allergens
  const safeFoods = BANGLADESHI_FOODS.filter((food) => {
    // Check allergens hard exclusion
    const hasAllergen = (food.allergens || []).some((all) => allergies.includes(all));
    if (hasAllergen) return false;

    // Check vegetarian / vegan
    if (isVegan) {
      if (food.category === 'dairy' || food.allergens.includes('dairy') || food.allergens.includes('egg') || food.allergens.includes('fish')) {
        return false;
      }
      if (['bg_rui_fish', 'bg_katla_fish', 'bg_ilish_fish', 'bg_chicken_breast', 'bg_lean_beef', 'bg_boiled_egg', 'bg_egg_white'].includes(food.id)) {
        return false;
      }
    } else if (isVegetarian) {
      if (['bg_rui_fish', 'bg_katla_fish', 'bg_ilish_fish', 'bg_chicken_breast', 'bg_lean_beef'].includes(food.id)) {
        return false;
      }
    } else if (isPescatarian) {
      if (['bg_chicken_breast', 'bg_lean_beef'].includes(food.id)) {
        return false;
      }
    }

    return true;
  });

  const days = [
    { num: 1, name: 'Day 1 (Monday)', focus: 'Metabolic Kickoff & Fiber Loading' },
    { num: 2, name: 'Day 2 (Tuesday)', focus: 'Omega-3 Fish & Heart-Healthy Greens' },
    { num: 3, name: 'Day 3 (Wednesday)', focus: 'Plant Protein & Probiotic Satiety' },
    { num: 4, name: 'Day 4 (Thursday)', focus: 'Lean Poultry & Whole Grain Energy' },
    { num: 5, name: 'Day 5 (Friday)', focus: 'Fresh Coastal Fish & Colorful Bhaji' },
    { num: 6, name: 'Day 6 (Saturday)', focus: 'High Protein Weekend Variety' },
    { num: 7, name: 'Day 7 (Sunday)', focus: 'Digestive Reset & Light Hydration' },
  ];

  return days.map((day) => {
    const mealSlots = buildDailyMealSlots(day.num, mealFrequency, targetCalories, safeFoods, isLowCarb, isBangladeshi);
    
    // Sum total macros for the day
    let dayCalories = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;
    let dayFiber = 0;

    mealSlots.forEach((slot) => {
      dayCalories += slot.slotCalories;
      dayProtein += slot.slotProtein;
      dayCarbs += slot.slotCarbs;
      dayFat += slot.slotFat;
      dayFiber += slot.slotFiber;
    });

    return {
      dayNumber: day.num,
      dayName: day.name,
      focusTitle: day.focus,
      meals: mealSlots,
      dayCalories: Math.round(dayCalories),
      dayProtein: Math.round(dayProtein),
      dayCarbs: Math.round(dayCarbs),
      dayFat: Math.round(dayFat),
      dayFiber: Math.round(dayFiber),
    };
  });
}

function buildDailyMealSlots(dayNum, mealFrequency, targetCalories, safeFoods, isLowCarb, isBangladeshi) {
  const slots = [];

  // Helper to find food
  const findFood = (id, fallbackCategory) => {
    const found = safeFoods.find((f) => f.id === id);
    if (found) return found;
    return safeFoods.find((f) => f.category === fallbackCategory) || safeFoods[0];
  };

  // 1. BREAKFAST (~25% of calories)
  const bfastCalories = Math.round(targetCalories * 0.25);
  const bfastItems = [];
  if (dayNum % 2 === 1) {
    // Eggs / Tofu + Roti / Oats + Veg
    const carb = isLowCarb ? findFood('bg_cucumber_salad', 'vegetables') : findFood('bg_atta_roti', 'carbs');
    const prot = findFood('bg_boiled_egg', 'protein');
    const veg = findFood('bg_cucumber_salad', 'vegetables');

    bfastItems.push(createMealItem(carb, isLowCarb ? 100 : 70, isLowCarb ? '1 bowl salad' : '2 medium rotis'));
    bfastItems.push(createMealItem(prot, 100, '2 boiled whole eggs'));
    bfastItems.push(createMealItem(veg, 100, '1 fresh cucumber salad plate'));
  } else {
    // Oats / Khichuri + Tok Doi / Milk + Fruits
    const carb = isLowCarb ? findFood('bg_boiled_egg', 'protein') : findFood('bg_oats', 'carbs');
    const dairy = findFood('bg_tok_doi', 'dairy');
    const fruit = findFood('bg_guava', 'fruits');

    bfastItems.push(createMealItem(carb, 50, '1 bowl cooked oats'));
    bfastItems.push(createMealItem(dairy, 120, '1 small cup Tok Doi (curd)'));
    bfastItems.push(createMealItem(fruit, 100, '1 small crunchy guava slice'));
  }
  slots.push(buildSlot('breakfast', 'Breakfast', '08:00 AM', bfastItems));

  // 2. MORNING SNACK (If 4 or 5 meals)
  if (mealFrequency >= 4) {
    const fruit = dayNum % 2 === 1 ? findFood('bg_guava', 'fruits') : findFood('bg_papaya', 'fruits');
    const nuts = findFood('bg_raw_peanuts', 'fats');
    const mSnackItems = [
      createMealItem(fruit, 100, '1 small seasonal fruit portion'),
      createMealItem(nuts, 20, '1 small handful raw peanuts/almonds'),
    ];
    slots.push(buildSlot('morning_snack', 'Morning Fuel', '11:00 AM', mSnackItems));
  }

  // 3. LUNCH (~35% of calories)
  const lunchItems = [];
  const rice = isLowCarb
    ? findFood('bg_cucumber_salad', 'vegetables')
    : dayNum % 2 === 1
    ? findFood('bg_brown_rice', 'carbs')
    : findFood('bg_white_rice', 'carbs');
  
  // Fish rotation (Rui, Katla) vs Chicken vs Dal
  let lunchProt = findFood('bg_rui_fish', 'protein');
  if (dayNum === 2 || dayNum === 5) lunchProt = findFood('bg_katla_fish', 'protein');
  else if (dayNum === 4) lunchProt = findFood('bg_chicken_breast', 'protein');
  else if (dayNum === 3) lunchProt = findFood('bg_masoor_dal', 'protein');

  const lunchVeg = dayNum % 2 === 1 ? findFood('bg_lal_shak', 'vegetables') : findFood('bg_lau_torkari', 'vegetables');
  const lunchDal = findFood('bg_masoor_dal', 'protein');
  const lunchOil = findFood('bg_mustard_oil', 'fats');

  lunchItems.push(createMealItem(rice, isLowCarb ? 120 : 140, isLowCarb ? '1 bowl cauliflower/salad' : '1 controlled cup cooked'));
  lunchItems.push(createMealItem(lunchProt, 120, '1 palm-sized cooked portion (120g)'));
  lunchItems.push(createMealItem(lunchVeg, 150, '1 generous bowl cooked bhaji/torkari (150g)'));
  if (lunchProt.id !== 'bg_masoor_dal') {
    lunchItems.push(createMealItem(lunchDal, 100, '1 small bowl thin Dal (100ml)'));
  }
  lunchItems.push(createMealItem(lunchOil, 8, '1 measured teaspoon during cooking'));

  slots.push(buildSlot('lunch', 'Traditional Balanced Lunch', '01:30 PM', lunchItems));

  // 4. AFTERNOON SNACK (~10% of calories, only if 5+ meals)
  if (mealFrequency >= 5) {
    const cholaOrTokDoi = dayNum % 2 === 1 ? findFood('bg_chola', 'protein') : findFood('bg_tok_doi', 'dairy');
    const aftFruit = findFood('bg_orange', 'fruits');
    const aftSnackItems = [
      createMealItem(cholaOrTokDoi, 70, '1 small cup boiled chola or Tok Doi'),
      createMealItem(aftFruit, 100, '1 fresh orange or green tea'),
    ];
    slots.push(buildSlot('afternoon_snack', 'Afternoon Refreshment', '05:00 PM', aftSnackItems));
  }

  // 5. DINNER (~30% of calories)
  const dinnerItems = [];
  const dinCarb = isLowCarb
    ? findFood('bg_cucumber_salad', 'vegetables')
    : dayNum % 2 === 1
    ? findFood('bg_atta_roti', 'carbs')
    : findFood('bg_sweet_potato', 'carbs');

  const dinProt =
    dayNum % 3 === 0
      ? findFood('bg_chicken_breast', 'protein')
      : dayNum % 2 === 0
      ? findFood('bg_boiled_egg', 'protein')
      : findFood('bg_rui_fish', 'protein');

  const dinVeg = dayNum % 2 === 1 ? findFood('bg_palong_shak', 'vegetables') : findFood('bg_dherosh_bhaji', 'vegetables');
  const dinSalad = findFood('bg_cucumber_salad', 'vegetables');

  dinnerItems.push(createMealItem(dinCarb, isLowCarb ? 120 : 70, isLowCarb ? '1 bowl salad' : '2 handmade Atta rotis'));
  dinnerItems.push(createMealItem(dinProt, 120, '1 palm-sized lean portion'));
  dinnerItems.push(createMealItem(dinVeg, 140, '1 medium bowl cooked vegetable'));
  dinnerItems.push(createMealItem(dinSalad, 100, '1 plate fresh cucumber tomato salad'));

  slots.push(buildSlot('dinner', 'Light Satisfying Dinner', '08:00 PM', dinnerItems));

  // If user requested 2 meals (Breakfast + Dinner)
  if (mealFrequency === 2) {
    const bfast = slots.find(s => s.mealType === 'breakfast');
    const din = slots.find(s => s.mealType === 'dinner');
    return [bfast, din].filter(Boolean);
  }

  return slots;
}

function createMealItem(food, grams, portionDescription) {
  const factor = grams / 100;
  return {
    id: 'item_' + Math.random().toString(36).substring(2, 8),
    foodId: food.id,
    name: food.name,
    bengaliName: food.bengaliName,
    portion: portionDescription || `${grams}g`,
    grams,
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    fiber: Math.round(food.fiberPer100g * factor * 10) / 10,
    substitutionGroup: food.substitutionGroup || 'general',
  };
}

function buildSlot(mealType, title, time, items) {
  let slotCalories = 0;
  let slotProtein = 0;
  let slotCarbs = 0;
  let slotFat = 0;
  let slotFiber = 0;

  items.forEach((it) => {
    slotCalories += it.calories;
    slotProtein += it.protein;
    slotCarbs += it.carbs;
    slotFat += it.fat;
    slotFiber += it.fiber;
  });

  return {
    mealType,
    title,
    time,
    items,
    slotCalories: Math.round(slotCalories),
    slotProtein: Math.round(slotProtein * 10) / 10,
    slotCarbs: Math.round(slotCarbs * 10) / 10,
    slotFat: Math.round(slotFat * 10) / 10,
    slotFiber: Math.round(slotFiber * 10) / 10,
  };
}

/**
 * 8. Food Substitution / Swap Engine
 */
function getFoodSwaps(foodId, userAllergies = [], dietType = 'balanced') {
  const targetFood = BANGLADESHI_FOODS.find((f) => f.id === foodId);
  if (!targetFood) return [];

  const subGroup = targetFood.substitutionGroup;

  // Find other foods in the same or compatible substitution group
  const candidates = BANGLADESHI_FOODS.filter((f) => {
    if (f.id === foodId) return false;
    // Exclude allergens
    const hasAllergen = (f.allergens || []).some((all) => userAllergies.includes(all));
    if (hasAllergen) return false;

    // Match substitution groups
    if (f.substitutionGroup === subGroup) return true;
    if (
      (subGroup === 'main_protein' || subGroup === 'lean_protein' || subGroup === 'plant_protein') &&
      (f.substitutionGroup === 'main_protein' || f.substitutionGroup === 'lean_protein' || f.substitutionGroup === 'plant_protein')
    ) {
      return true;
    }
    if (
      (subGroup === 'starchy_carb' || subGroup === 'whole_grain_carb') &&
      (f.substitutionGroup === 'starchy_carb' || f.substitutionGroup === 'whole_grain_carb')
    ) {
      return true;
    }
    if (
      (subGroup === 'leafy_veg' || subGroup === 'water_veg' || subGroup === 'salad_veg') &&
      (f.substitutionGroup === 'leafy_veg' || f.substitutionGroup === 'water_veg' || f.substitutionGroup === 'salad_veg')
    ) {
      return true;
    }
    return false;
  });

  return candidates.slice(0, 4).map((cand) => {
    const factor = cand.defaultPortionGrams / 100;
    return {
      foodId: cand.id,
      name: cand.name,
      bengaliName: cand.bengaliName,
      portion: cand.householdPortion,
      grams: cand.defaultPortionGrams,
      calories: Math.round(cand.caloriesPer100g * factor),
      protein: Math.round(cand.proteinPer100g * factor * 10) / 10,
      carbs: Math.round(cand.carbsPer100g * factor * 10) / 10,
      fat: Math.round(cand.fatPer100g * factor * 10) / 10,
      fiber: Math.round(cand.fiberPer100g * factor * 10) / 10,
      reason: `Matches ${targetFood.name} in ${cand.substitutionGroup.replace('_', ' ')} density.`,
    };
  });
}

/**
 * 9. Adaptive 2-3 Week Plan Review Engine
 */
function reviewAdaptiveProgress(input) {
  const { startingWeightKg, currentWeightKg, weeksElapsed = 3, hungerRating = 3, energyRating = 3, adherenceRating = 4 } = input;
  const weightChangeKg = Math.round((currentWeightKg - startingWeightKg) * 10) / 10;
  const weeklyRate = Math.round((weightChangeKg / Math.max(1, weeksElapsed)) * 100) / 100;

  let status = 'optimal_progress';
  let headline = 'Great Steady Progress! Your Plan is Working.';
  const recommendations = [];

  if (weeklyRate <= -0.2 && weeklyRate >= -0.75) {
    status = 'optimal_progress';
    headline = `Excellent Progress: Lost ${Math.abs(weightChangeKg)} kg over ${weeksElapsed} weeks (~${Math.abs(weeklyRate)} kg/wk).`;
    recommendations.push('Your caloric deficit and meal composition are right in the sweet spot for sustainable fat loss.');
    recommendations.push('Continue with your current meal portions and hydration targets.');
    if (hungerRating >= 4) {
      recommendations.push('To curb elevated hunger, add an extra bowl of cooked leafy greens (Lal Shak / Palong) or cucumber salad at lunch.');
    }
  } else if (weeklyRate < -0.8) {
    status = 'rapid_loss';
    headline = `Fast Weight Reduction (${Math.abs(weeklyRate)} kg/week). Let's protect your lean muscle.`;
    recommendations.push('A rapid initial drop is common from water/glycogen, but ensure you do not feel overly fatigued.');
    recommendations.push('Add an extra 15-20g of complex carbs (e.g. half cup brown rice or 1 Atta roti) to prevent metabolic slowdown.');
  } else if (weeklyRate > -0.15 && weeklyRate <= 0.2) {
    status = 'slower_progress';
    headline = 'Weight is Holding Steady. Minor Fine-Tuning Recommended.';
    recommendations.push('Track cooking oils carefully: use a measured tablespoon of mustard/olive oil rather than free pouring into the pan.');
    recommendations.push('Incorporate a 15-20 minute brisk post-meal walk (aim for 8,000 daily steps) to boost energy expenditure.');
    if (adherenceRating < 3) {
      recommendations.push('Focus on consistency for the next 7 days without weekend overeating.');
    }
  } else if (weeklyRate > 0.2) {
    status = 'slower_progress';
    headline = 'Weight has slightly increased. Reviewing portion sizes.';
    recommendations.push('Check portion sizes for carbohydrate staples (limit cooked rice to 1 level cup).');
    recommendations.push('Ensure liquid calories (sweetened tea, juices, sugary coffees) are completely replaced with plain water or green tea.');
  }

  return {
    weightChangeKg,
    weeklyRateKg: weeklyRate,
    status,
    headline,
    recommendations,
  };
}

/**
 * 10. Master Recommendation Pipeline
 */
function generatePersonalizedDietRecommendation(userProfile) {
  // 1. Rank diets
  const rankedDiets = rankDietProtocols(userProfile);
  const topDiet = rankedDiets[0];

  // 2. Calculate safe energy & macro targets
  const summary = calculateSafeCalorieAndMacroTargets(userProfile, topDiet);

  // 3. Generate 7-day personalized plan
  const sevenDayPlan = generate7DayMealPlan(userProfile, summary.targetCalories, topDiet);

  // 4. Compile Safety Alerts
  const safetyAlerts = {
    requiresDoctorConsult: topDiet.requiresDoctorConsult,
    messages: topDiet.doctorConsultReasons || [],
  };

  // 5. Behavioral Bangladeshi eating advice
  const behavioralTips = [
    '🥗 Eat Your Vegetables / Shak First: Starting lunch and dinner with cooked vegetables or salad slows gastric emptying and moderates blood sugar spikes.',
    '🥄 Measure Your Cooking Oil: Use a measured tablespoon of cold-pressed mustard oil or olive oil instead of free-pouring.',
    '🍚 Controlled Rice Portions: Keep cooked rice to 1 level cup (140-150g) and pair with ample fish, dal, and greens.',
    '💧 Pre-Meal Hydration: Drink a 250ml glass of water 15 minutes before lunch and dinner to promote natural fullness.',
  ];

  return {
    id: 'plan_' + Date.now().toString(36),
    createdAt: new Date().toISOString(),
    summary,
    topMatches: rankedDiets,
    selectedDiet: topDiet,
    safetyAlerts,
    behavioralTips,
    sevenDayPlan,
  };
}

module.exports = {
  calculateAge,
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateSafeCalorieAndMacroTargets,
  rankDietProtocols,
  generate7DayMealPlan,
  getFoodSwaps,
  reviewAdaptiveProgress,
  generatePersonalizedDietRecommendation,
};

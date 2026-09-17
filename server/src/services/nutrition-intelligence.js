const dietPlansData = require('../nutrition/diet-plans.json');
const medicalRulesData = require('../nutrition/medical-rules.json');
const foodDatabase = require('../nutrition/food-database.json');
const recommendationRules = require('../nutrition/recommendation-rules.json');

const CANONICAL_DIETS = dietPlansData.diet_plans;
const FOODS = foodDatabase.foods;
const MEDICAL_RULES = medicalRulesData.conditions;

/**
 * Universal resolver to match any canonical ID, slug, legacy name, or keyword
 */
function resolveDietPlan(identifier) {
  if (!identifier) return CANONICAL_DIETS[0];
  if (typeof identifier === 'object') {
    if (identifier.id || identifier.slug || identifier.name) {
      const match = resolveDietPlan(identifier.id || identifier.slug || identifier.name);
      return match || identifier;
    }
    return identifier;
  }

  const raw = String(identifier).trim().toLowerCase();
  const normalized = raw.replace(/[_\-\s]+/g, '');

  // 1. Exact match by id, slug, or name
  let match = CANONICAL_DIETS.find(
    (d) =>
      d.id.toLowerCase() === raw ||
      d.slug.toLowerCase() === raw ||
      d.name.toLowerCase() === raw ||
      d.id.replace(/[_\-\s]+/g, '').toLowerCase() === normalized ||
      d.slug.replace(/[_\-\s]+/g, '').toLowerCase() === normalized ||
      d.name.replace(/[_\-\s]+/g, '').toLowerCase() === normalized
  );
  if (match) return match;

  // 2. Fuzzy / keyword match for legacy or custom names
  match = CANONICAL_DIETS.find((d) => {
    const dNorm = (d.name + ' ' + d.id + ' ' + d.slug).toLowerCase();
    if (raw.includes('pcos') && dNorm.includes('pcos')) return true;
    if ((raw.includes('thyroid') || raw.includes('hypo')) && dNorm.includes('hypothyroidism')) return true;
    if ((raw.includes('insulin') || raw.includes('diabetes') || raw.includes('low-gi')) && dNorm.includes('insulin')) return true;
    if ((raw.includes('keto') || raw.includes('ketogenic')) && dNorm.includes('keto')) return true;
    if ((raw.includes('fasting') || raw.includes('14/10') || raw.includes('14-10')) && dNorm.includes('fasting')) return true;
    if ((raw.includes('gut') || raw.includes('bloat') || raw.includes('ibs')) && dNorm.includes('gut')) return true;
    if ((raw.includes('dash') || raw.includes('hypertension') || raw.includes('cardio') || raw.includes('pressure')) && dNorm.includes('dash')) return true;
    if ((raw.includes('muscle') || raw.includes('recomp') || raw.includes('high protein') || raw.includes('gym')) && dNorm.includes('muscle')) return true;
    if ((raw.includes('estrogen') || raw.includes('plant-based') || raw.includes('plant based') || raw.includes('plant')) && dNorm.includes('estrogen')) return true;
    if ((raw.includes('iron') || raw.includes('anemia') || raw.includes('hemoglobin')) && dNorm.includes('anemia')) return true;
    if ((raw.includes('postpartum') || raw.includes('lactation') || raw.includes('pregnancy')) && dNorm.includes('postpartum')) return true;
    if ((raw.includes('collagen') || raw.includes('skin') || raw.includes('hair')) && dNorm.includes('collagen')) return true;
    if ((raw.includes('mediterranean') || raw.includes('longevity')) && dNorm.includes('mediterranean')) return true;
    if ((raw.includes('cortisol') || raw.includes('adrenal') || raw.includes('stress')) && dNorm.includes('cortisol')) return true;
    if ((raw.includes('weight-gain') || raw.includes('weight gain') || raw.includes('amenorrhea') || raw.includes('nourish')) && dNorm.includes('weight_gain')) return true;
    if ((raw.includes('pmdd') || raw.includes('pms') || raw.includes('mood') || raw.includes('menstrual')) && dNorm.includes('pmdd')) return true;
    if ((raw.includes('perimenopause') || raw.includes('menopause') || raw.includes('bone')) && dNorm.includes('perimenopause')) return true;
    if ((raw.includes('fatty') || raw.includes('liver') || raw.includes('nafld')) && dNorm.includes('fatty')) return true;
    if ((raw.includes('uric') || raw.includes('gout') || raw.includes('purine')) && dNorm.includes('uric')) return true;
    if ((raw.includes('fertility') || raw.includes('ovulation') || raw.includes('conception')) && dNorm.includes('fertility')) return true;
    return false;
  });

  if (match) return match;

  return CANONICAL_DIETS[0];
}

/**
 * Finds a food in the composition database by ID or name
 */
function findFoodItem(foodIdentifier) {

  if (!foodIdentifier) return null;
  const idOrName = String(foodIdentifier).toLowerCase().trim();

  // Match by exact food_id
  let match = FOODS.find((f) => f.food_id.toLowerCase() === idOrName);
  if (match) return match;

  // Match by name or bangla name
  match = FOODS.find(
    (f) =>
      f.name.toLowerCase().includes(idOrName) ||
      (f.bangla_name && f.bangla_name.includes(idOrName)) ||
      idOrName.includes(f.name.toLowerCase())
  );
  if (match) return match;

  // Default synthetic food if not found in dictionary
  return {
    food_id: idOrName.replace(/\s+/g, '_'),
    name: foodIdentifier,
    bangla_name: '',
    category: 'general',
    serving_state: 'cooked',
    serving_size_g: 100,
    nutrition_per_100g: {
      calories: 120,
      protein: 4.0,
      carbs: 18.0,
      fat: 3.0,
      fiber: 2.0,
      sodium_mg: 50,
    },
    glycemic_index: { value: 45, category: 'low' },
    purine_level: 'low',
    goitrogen: { contains: false },
    allergens: [],
    suitable_diets: [],
    limiting_diets: [],
  };
}

/**
 * Evaluates food against user allergies
 */
function evaluateAllergyConflict(foodData, allergies = []) {
  if (!allergies || allergies.length === 0 || !foodData.allergens) {
    return { hasConflict: false, conflictingAllergens: [] };
  }

  const userAllergiesLower = allergies.map((a) => a.toLowerCase().trim());
  const conflicts = foodData.allergens.filter((allergen) =>
    userAllergiesLower.includes(allergen.toLowerCase())
  );

  return {
    hasConflict: conflicts.length > 0,
    conflictingAllergens: conflicts,
  };
}

/**
 * Multi-factor purine risk scoring for Gout
 */
function calculatePurineRisk(foodData, portionG) {
  const purineLevel = foodData.purine_level || 'low';
  const portion = portionG || foodData.serving_size_g || 100;

  if (purineLevel === 'high') {
    return {
      status: 'LIMIT',
      reason: `"${foodData.name}" has a high purine density. In hyperuricemia/gout, moderation and hydration are advised.`,
    };
  }

  if (purineLevel === 'moderate') {
    if (portion > 150) {
      return {
        status: 'LIMIT',
        reason: `Portion size (${portion}g) contains moderate purines. Consider keeping servings under 100g per meal.`,
      };
    }
    return {
      status: 'CAUTION',
      reason: `"${foodData.name}" has moderate purine content; standard portions are acceptable alongside ample hydration.`,
    };
  }

  return {
    status: 'SAFE',
    reason: `"${foodData.name}" is a low-purine food compatible with healthy uric acid management.`,
  };
}

/**
 * Glycemic and portion risk scoring for Diabetes (ADA plate method)
 */
function calculateDiabetesRisk(foodData, portionG) {
  const isRefinedGrain =
    foodData.food_id.includes('rice_white') ||
    foodData.name.toLowerCase().includes('white rice') ||
    foodData.name.toLowerCase().includes('maida') ||
    foodData.name.toLowerCase().includes('sugar');

  const portion = portionG || foodData.serving_size_g || 100;

  if (isRefinedGrain) {
    if (portion >= 200) {
      return {
        status: 'LIMIT',
        reason: `Large portion (${portion}g) of refined carbohydrate has a high glycemic load; consider reducing to 100-120g or pairing with high fiber.`,
      };
    }
    return {
      status: 'CAUTION',
      reason: `Refined carbohydrate with potentially higher glycemic impact; portion and meal composition (adding fiber/protein) matter.`,
    };
  }

  if (foodData.glycemic_index && foodData.glycemic_index.category === 'high') {
    return {
      status: 'CAUTION',
      reason: `Food has a higher glycemic index; balance your plate with non-starchy vegetables and lean protein.`,
    };
  }

  return {
    status: 'SAFE',
    reason: `Low-to-moderate glycemic profile supporting steady postprandial glucose stability.`,
  };
}

/**
 * Goitrogen evaluation for Hypothyroidism
 */
function calculateThyroidRisk(foodData) {
  if (foodData.goitrogen && foodData.goitrogen.contains) {
    if (foodData.serving_state === 'raw') {
      return {
        status: 'CAUTION',
        reason: `Raw cruciferous vegetables contain goitrogenic compounds; thorough cooking deactivates myrosinase and makes them safe.`,
      };
    }
    return {
      status: 'SAFE',
      reason: `Cooked cruciferous vegetables are safe and supply beneficial micronutrients without significant goitrogenic activity.`,
    };
  }
  return {
    status: 'SAFE',
    reason: `Nutrient-dense food supporting thyroid metabolic synthesis.`,
  };
}

/**
 * Evaluates food against medical conditions
 */
function evaluateFoodMedicalSafety(foodData, portionG, medicalConditions = [], medications = []) {
  if (!medicalConditions || medicalConditions.length === 0) {
    return { status: 'SAFE', reasons: [], professionalReviewRequired: false };
  }

  const conditionsLower = medicalConditions.map((c) => c.toLowerCase().trim());
  let highestRisk = 'SAFE'; // Hierarchy: SAFE < CAUTION < LIMIT < AVOID < PROFESSIONAL_REVIEW
  const reasons = [];
  let profReview = false;

  // 1. CKD Check
  if (conditionsLower.some((c) => c.includes('ckd') || c.includes('kidney'))) {
    if (foodData.nutrition_per_100g && foodData.nutrition_per_100g.protein > 15) {
      profReview = true;
      reasons.push('High-protein foods in CKD require personalized clinical review based on eGFR and kidney stage.');
      highestRisk = 'PROFESSIONAL_REVIEW';
    }
  }

  // 2. Gout / Hyperuricemia Check
  if (conditionsLower.some((c) => c.includes('gout') || c.includes('uric'))) {
    const goutEval = calculatePurineRisk(foodData, portionG);
    if (goutEval.status !== 'SAFE') {
      reasons.push(goutEval.reason);
      if (highestRisk === 'SAFE' || highestRisk === 'CAUTION') highestRisk = goutEval.status;
    }
  }

  // 3. Diabetes Check
  if (conditionsLower.some((c) => c.includes('diabet') || c.includes('insulin'))) {
    const diabEval = calculateDiabetesRisk(foodData, portionG);
    if (diabEval.status !== 'SAFE') {
      reasons.push(diabEval.reason);
      if (highestRisk === 'SAFE' || (highestRisk === 'CAUTION' && diabEval.status === 'LIMIT')) {
        highestRisk = diabEval.status;
      }
    }
  }

  // 4. Hypothyroidism Check
  if (conditionsLower.some((c) => c.includes('thyroid') || c.includes('hashimoto'))) {
    const thyroidEval = calculateThyroidRisk(foodData);
    if (thyroidEval.status !== 'SAFE') {
      reasons.push(thyroidEval.reason);
      if (highestRisk === 'SAFE') highestRisk = thyroidEval.status;
    }
  }

  // 5. Hypertension Check
  if (conditionsLower.some((c) => c.includes('hypertens') || c.includes('pressure') || c.includes('cardio'))) {
    const sodium = (foodData.nutrition_per_100g && foodData.nutrition_per_100g.sodium_mg) || 0;
    if (sodium > 400) {
      reasons.push(`Elevated sodium (${sodium}mg/100g). AHA recommends working toward ≤1,500mg daily where appropriate.`);
      if (highestRisk === 'SAFE' || highestRisk === 'CAUTION') highestRisk = 'LIMIT';
    }
  }

  return {
    status: highestRisk,
    reasons,
    professionalReviewRequired: profReview,
  };
}

/**
 * Evaluates food against active diet plan
 */
function evaluateDietCompliance(foodData, portionG, activeDietPlan) {
  if (!activeDietPlan) {
    return { isCompliant: true, status: 'SAFE', reasons: [] };
  }

  const nameLower = foodData.name.toLowerCase();
  const forbidden = activeDietPlan.forbiddenKeywords || [];
  const matchedForbidden = forbidden.find((k) => nameLower.includes(k.toLowerCase()));

  if (matchedForbidden) {
    if (activeDietPlan.slug && activeDietPlan.slug.includes('hypothyroidism')) {
      if (foodData.goitrogen && foodData.goitrogen.contains) {
        return {
          isCompliant: true,
          status: 'CAUTION',
          reasons: [`"${foodData.name}" contains goitrogenic compounds when raw; cook thoroughly to neutralize.`],
        };
      }
    }

    if (activeDietPlan.slug && activeDietPlan.slug.includes('keto')) {
      return {
        isCompliant: false,
        status: 'LIMIT',
        reasons: [`"${foodData.name}" contains net carbohydrates that may interrupt nutritional ketosis.`],
      };
    }

    return {
      isCompliant: false,
      status: 'LIMIT',
      reasons: [`"${foodData.name}" is generally limited on the ${activeDietPlan.name} protocol.`],
    };
  }


  return {
    isCompliant: true,
    status: 'SAFE',
    reasons: [`"${foodData.name}" aligns with the ${activeDietPlan.name} guidelines.`],
  };
}

/**
 * Generates smart contextual alternative food suggestions
 */
function generateFoodAlternatives(foodData, activeDietPlan, medicalConditions = []) {
  const alternatives = [];
  const nameLower = foodData.name.toLowerCase();

  if (nameLower.includes('white rice') || nameLower.includes('rice')) {
    alternatives.push('Red Rice (Lal chal)', 'Steel-cut Oats', 'Quinoa / Mixed Dal');
  } else if (nameLower.includes('fish') || foodData.category === 'fish_seafood') {
    alternatives.push('Boiled Eggs', 'Low-fat Tok doi (Yogurt)', 'Deshi Chicken Breast');
  } else if (nameLower.includes('cabbage') || nameLower.includes('cauliflower')) {
    alternatives.push('Cooked Spinach (Palong Shak)', 'Steamed Bottle Gourd (Lau)', 'Pointed Gourd (Potol)');
  } else if (nameLower.includes('chips') || nameLower.includes('fried')) {
    alternatives.push('Roasted Pumpkin Seeds', 'Fresh Cucumber Slices', 'Plain Tok doi');
  } else {
    alternatives.push('Fresh Leafy Greens', 'Deshi Fish / Chicken', 'Lentil Dal');
  }

  return alternatives;
}

/**
 * Primary Unified Food Evaluation Engine
 */
function evaluateFoodScan(foodIdentifier, portionG = 100, userContext = {}) {
  const { activeDiet, medicalConditions = [], allergies = [], medications = [] } = userContext;

  const foodData = typeof foodIdentifier === 'object' ? foodIdentifier : findFoodItem(foodIdentifier);
  const matchedDiet = resolveDietPlan(activeDiet);


  // Step 1: Allergy Check (Immediate AVOID trigger)
  const allergyCheck = evaluateAllergyConflict(foodData, allergies);
  if (allergyCheck.hasConflict) {
    return {
      status: 'AVOID',
      badgeVariant: 'rose',
      tag: '🚫 Allergen Conflict Alert',
      clinicalFeedback: `"${foodData.name}" contains verified allergens (${allergyCheck.conflictingAllergens.join(', ')}). Strict avoidance is advised.`,
      recommendation: 'Do not consume. Choose non-allergenic alternatives.',
      alternativeSuggestions: generateFoodAlternatives(foodData, matchedDiet, medicalConditions),
      professionalReviewRequired: false,
      portionG,
      nutrition: calculateNutritionForPortion(foodData, portionG),
    };
  }

  // Step 2: Medical Safety Check
  const medicalCheck = evaluateFoodMedicalSafety(foodData, portionG, medicalConditions, medications);
  if (medicalCheck.professionalReviewRequired) {
    return {
      status: 'PROFESSIONAL_REVIEW',
      badgeVariant: 'indigo',
      tag: '🏥 Professional Review Recommended',
      clinicalFeedback: medicalCheck.reasons.join(' ') || 'NutriLens cannot safely determine automated suitability for this clinical profile.',
      recommendation: 'Consult your treating nephrologist or clinical dietitian.',
      alternativeSuggestions: generateFoodAlternatives(foodData, matchedDiet, medicalConditions),
      professionalReviewRequired: true,
      portionG,
      nutrition: calculateNutritionForPortion(foodData, portionG),
    };
  }

  // Step 3: Diet Plan Compliance
  const dietCheck = evaluateDietCompliance(foodData, portionG, matchedDiet);

  // Determine final status
  let finalStatus = 'SAFE';
  let badgeVariant = 'emerald';
  let tag = `✅ ${matchedDiet.name} Approved`;

  if (medicalCheck.status === 'LIMIT' || dietCheck.status === 'LIMIT') {
    finalStatus = 'LIMIT';
    badgeVariant = 'orange';
    tag = '⚠️ Moderation Recommended';
  } else if (medicalCheck.status === 'CAUTION' || dietCheck.status === 'CAUTION') {
    finalStatus = 'CAUTION';
    badgeVariant = 'amber';
    tag = 'ℹ️ Mindful Portion & Preparation';
  }

  const combinedFeedback = [...medicalCheck.reasons, ...dietCheck.reasons].filter(Boolean);
  const clinicalFeedback =
    combinedFeedback.length > 0
      ? combinedFeedback.join(' ')
      : `"${foodData.name}" aligns well with your current ${matchedDiet.name} protocol and health goals.`;

  return {
    status: finalStatus,
    badgeVariant,
    tag,
    clinicalFeedback,
    recommendation:
      finalStatus === 'SAFE'
        ? 'Nutritious choice. Track portion accurately.'
        : finalStatus === 'CAUTION'
        ? 'Mind portion size and balanced meal pairing.'
        : 'Consume in moderation; prioritize high-fiber whole foods.',
    alternativeSuggestions:
      finalStatus === 'SAFE' ? [] : generateFoodAlternatives(foodData, matchedDiet, medicalConditions),
    professionalReviewRequired: false,
    portionG,
    nutrition: calculateNutritionForPortion(foodData, portionG),
  };
}

/**
 * Calculates scaled macronutrients for a given portion
 */
function calculateNutritionForPortion(foodData, portionG) {
  const base = (foodData && foodData.nutrition_per_100g) || {
    calories: 120,
    protein: 4,
    carbs: 18,
    fat: 3,
    fiber: 2,
    sodium_mg: 50,
  };
  const factor = (portionG || 100) / 100;

  return {
    calories: Math.round(base.calories * factor),
    protein_g: Number((base.protein * factor).toFixed(1)),
    carbs_g: Number((base.carbs * factor).toFixed(1)),
    fat_g: Number((base.fat * factor).toFixed(1)),
    fiber_g: Number((base.fiber * factor).toFixed(1)),
    sodium_mg: Math.round(base.sodium_mg * factor),
  };
}

/**
 * Validates a user profile before adopting a diet protocol
 */
function validateDietAdoption(userProfile = {}, dietPlanIdentifier) {
  const dietPlan = resolveDietPlan(dietPlanIdentifier);

  if (!dietPlan) {
    return {
      canAdopt: false,
      status: 'error',
      message: 'Diet protocol not found in canonical catalog.',
    };
  }


  const conditions = (userProfile.medicalConditions || userProfile.medical_conditions || []).map((c) =>
    c.toLowerCase().trim()
  );
  const bmi = userProfile.bmi || (userProfile.weightKg && userProfile.heightCm ? userProfile.weightKg / Math.pow(userProfile.heightCm / 100, 2) : 22);
  const age = userProfile.age || 25;

  // 1. Check Hard Contraindications (CKD, Pregnancy, Underweight)
  if (conditions.some((c) => c.includes('ckd') || c.includes('kidney'))) {
    if (dietPlan.id === 'muscle_recomp' || dietPlan.id === 'deshi_keto') {
      return {
        canAdopt: false,
        status: 'PROFESSIONAL_REVIEW',
        message: 'High-protein or ketogenic protocols in CKD require personalized nephrology and renal dietitian clearance.',
        requiredAction: 'consult_qualified_healthcare_professional',
        professionalReviewRequired: true,
      };
    }
  }

  if (conditions.some((c) => c.includes('pregnancy'))) {
    if (dietPlan.id === 'deshi_keto' || dietPlan.id === 'hormone_safe_fasting_14_10') {
      return {
        canAdopt: false,
        status: 'PROFESSIONAL_REVIEW',
        message: 'Ketogenic or time-restricted fasting diets are not recommended during pregnancy without obstetrician supervision.',
        requiredAction: 'consult_qualified_healthcare_professional',
        professionalReviewRequired: true,
      };
    }
  }

  if (bmi < 18.5 && (dietPlan.id === 'deshi_keto' || dietPlan.id === 'hormone_safe_fasting_14_10')) {
    return {
      canAdopt: false,
      status: 'BLOCKED',
      message: 'Calorie-restrictive or fasting protocols are not permitted for underweight individuals (BMI <18.5). We recommend the Nutritional Re-Nourish Protocol.',
      suggestedDietId: 'weight_gain_amenorrhea',
      professionalReviewRequired: false,
    };
  }

  return {
    canAdopt: true,
    status: 'SAFE',
    dietPlan,
    message: `Profile validated successfully for ${dietPlan.name}.`,
    professionalReviewRequired: false,
  };
}

/**
 * Calculates personalized calorie, macro, and hydration targets
 */
function calculatePersonalizedTargets(userProfile = {}, dietPlan) {
  const weightKg = userProfile.weightKg || userProfile.weight_kg || 70;
  const heightCm = userProfile.heightCm || userProfile.height_cm || 170;
  const age = userProfile.age || 26;
  const gender = userProfile.gender || userProfile.sex || 'female';
  const activityLevel = userProfile.activityLevel || userProfile.activity_level || 'moderately_active';
  const goal = userProfile.goal && userProfile.goal.type ? userProfile.goal.type : userProfile.goal || 'lose_weight';

  // Mifflin-St Jeor BMR Formula
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;

  // Activity Multipliers
  const activityMap = {
    sedentary: 1.2,
    lightly_active: 1.375,
    light: 1.375,
    moderately_active: 1.55,
    moderate: 1.55,
    very_active: 1.725,
    high: 1.725,
    extra_active: 1.9,
  };
  const tdee = Math.round(bmr * (activityMap[activityLevel] || 1.4));

  // Calorie adjustments by goal
  let targetCalories = tdee;
  if (goal === 'lose_weight' || goal === 'weight_loss') {
    targetCalories = Math.max(1300, tdee - 450);
  } else if (goal === 'gain_muscle' || goal === 'weight_gain') {
    targetCalories = tdee + 350;
  }

  // Macro distribution from diet plan range
  const macroRatio = (dietPlan && dietPlan.macroRatio) || { protein: 30, carbs: 40, fat: 30 };
  const pPercent = macroRatio.protein || 30;
  const cPercent = macroRatio.carbs || 40;
  const fPercent = macroRatio.fat || 30;

  const targetProteinG = Math.round((targetCalories * (pPercent / 100)) / 4);
  const targetCarbsG = Math.round((targetCalories * (cPercent / 100)) / 4);
  const targetFatG = Math.round((targetCalories * (fPercent / 100)) / 9);
  const targetFiberG = Math.max(25, Math.round(targetCalories / 1000 * 14));
  const targetWaterMl = Math.round(weightKg * 35);

  return {
    tdee,
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    targetFiberG,
    targetWaterMl,
    macroDistribution: {
      proteinPercent: pPercent,
      carbsPercent: cPercent,
      fatPercent: fPercent,
    },
  };
}

/**
 * Scores and ranks the 20 canonical diet plans for a user profile
 */
function rankDietsForUser(userProfile = {}) {
  const conditions = (userProfile.medicalConditions || userProfile.medical_conditions || []).map((c) =>
    c.toLowerCase().trim()
  );

  return CANONICAL_DIETS.map((diet) => {
    let score = 50; // Baseline score

    // Condition match
    if (conditions.some((c) => diet.clinical_profile && diet.clinical_profile.suitable_conditions.includes(c))) {
      score += 35;
    }

    // Featured boost
    if (diet.isFeatured) score += 10;

    return {
      diet,
      score: Math.min(100, score),
      recommended: score >= 70,
    };
  }).sort((a, b) => b.score - a.score);
}

module.exports = {
  CANONICAL_DIETS,
  resolveDietPlan,
  evaluateFoodScan,
  evaluateFoodMedicalSafety,
  evaluateDietCompliance,
  evaluateAllergyConflict,
  calculatePurineRisk,
  calculateDiabetesRisk,
  calculateThyroidRisk,
  validateDietAdoption,
  calculatePersonalizedTargets,
  rankDietsForUser,
  generateFoodAlternatives,
};


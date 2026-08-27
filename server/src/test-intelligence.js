const {
  evaluateFoodScan,
  validateDietAdoption,
  calculatePersonalizedTargets,
  rankDietsForUser,
} = require('./services/nutrition-intelligence');

console.log('=== RUNNING CLINICAL NUTRITION INTELLIGENCE TESTS ===\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// Test 1: Healthy user + balanced food
const t1 = evaluateFoodScan('spinach_cooked', 100, { activeDiet: 'mediterranean_fusion' });
assert(t1.status === 'SAFE', `Test 1: Healthy user + Cooked Spinach -> Status is ${t1.status} (expected SAFE)`);

// Test 2: Diabetes + large white rice portion (250g)
const t2 = evaluateFoodScan('rice_white_cooked', 250, {
  activeDiet: 'deshi_low_gi_insulin_resistance',
  medicalConditions: ['type_2_diabetes'],
});
assert(t2.status === 'LIMIT', `Test 2: Diabetes + 250g White Rice -> Status is ${t2.status} (expected LIMIT)`);

// Test 3: Diabetes + moderate white rice portion (120g)
const t3 = evaluateFoodScan('rice_white_cooked', 120, {
  activeDiet: 'deshi_low_gi_insulin_resistance',
  medicalConditions: ['type_2_diabetes'],
});
assert(t3.status === 'CAUTION', `Test 3: Diabetes + 120g White Rice -> Status is ${t3.status} (expected CAUTION, not AVOID)`);

// Test 4: Peanut allergy + peanut
const t4 = evaluateFoodScan('peanut_roasted', 30, {
  activeDiet: 'weight_gain_amenorrhea',
  allergies: ['peanuts'],
});
assert(t4.status === 'AVOID', `Test 4: Peanut allergy + Peanut -> Status is ${t4.status} (expected AVOID)`);

// Test 5: Gout + Rohu fish 200g (large)
const t5 = evaluateFoodScan('fish_rohu_curry', 200, {
  activeDiet: 'low_purine_uric_acid_gout',
  medicalConditions: ['gout_hyperuricemia'],
});
assert(t5.status === 'LIMIT', `Test 5: Gout + 200g Rohu Fish -> Status is ${t5.status} (expected LIMIT)`);

// Test 6: Gout + Rohu fish 60g (small)
const t6 = evaluateFoodScan('fish_rohu_curry', 60, {
  activeDiet: 'low_purine_uric_acid_gout',
  medicalConditions: ['gout_hyperuricemia'],
});
assert(t6.status === 'CAUTION', `Test 6: Gout + 60g Rohu Fish -> Status is ${t6.status} (expected CAUTION)`);

// Test 7: Hypothyroidism + Raw Cabbage
const t7 = evaluateFoodScan('cabbage_raw', 85, {
  activeDiet: 'hypothyroidism_metabolic_boost',
  medicalConditions: ['hypothyroidism'],
});
assert(t7.status === 'CAUTION', `Test 7: Hypothyroidism + Raw Cabbage -> Status is ${t7.status} (expected CAUTION, not AVOID)`);

// Test 8: Hypothyroidism + Cooked Spinach
const t8 = evaluateFoodScan('spinach_cooked', 100, {
  activeDiet: 'hypothyroidism_metabolic_boost',
  medicalConditions: ['hypothyroidism'],
});
assert(t8.status === 'SAFE', `Test 8: Hypothyroidism + Cooked Spinach -> Status is ${t8.status} (expected SAFE)`);

// Test 9: Adoption - CKD + High Protein Diet (muscle_recomp)
const t9 = validateDietAdoption(
  { medicalConditions: ['ckd_kidney_disease'], weightKg: 75, heightCm: 175 },
  'muscle_recomp'
);
assert(!t9.canAdopt && t9.status === 'PROFESSIONAL_REVIEW', `Test 9: CKD adopting High Protein -> Blocked with PROFESSIONAL_REVIEW`);

// Test 10: Adoption - Pregnancy + Keto Diet
const t10 = validateDietAdoption(
  { medicalConditions: ['pregnancy'], weightKg: 65, heightCm: 160 },
  'deshi_keto'
);
assert(!t10.canAdopt && t10.status === 'PROFESSIONAL_REVIEW', `Test 10: Pregnancy adopting Keto -> Blocked with PROFESSIONAL_REVIEW`);

// Test 11: Adoption - Underweight + Fasting Diet
const t11 = validateDietAdoption(
  { bmi: 17.2, weightKg: 42, heightCm: 160 },
  'hormone_safe_fasting_14_10'
);
assert(!t11.canAdopt && t11.status === 'BLOCKED', `Test 11: Underweight (BMI 17.2) adopting Fasting -> BLOCKED`);

// Test 12: Adoption - Hypertension + DASH
const t12 = validateDietAdoption(
  { medicalConditions: ['hypertension'], weightKg: 78, heightCm: 172 },
  'dash_cardio_care'
);
assert(t12.canAdopt && t12.status === 'SAFE', `Test 12: Hypertension adopting DASH -> Approved (SAFE)`);

// Test 13: Personalized Target Calculation
const targets = calculatePersonalizedTargets(
  { weightKg: 70, heightCm: 170, age: 28, gender: 'female', activityLevel: 'moderately_active', goal: 'lose_weight' },
  { macroRatio: { protein: 30, carbs: 35, fat: 35 } }
);
assert(targets.targetCalories > 1200 && targets.targetProteinG > 0 && targets.targetWaterMl >= 2000, `Test 13: Personalized targets calculated successfully (Calories: ${targets.targetCalories}, Protein: ${targets.targetProteinG}g, Water: ${targets.targetWaterMl}ml)`);

// Test 14: Diet Ranking
const ranked = rankDietsForUser({ medicalConditions: ['pcos'] });
assert(ranked.length === 20 && ranked[0].diet.id === 'pcos_hormone_balance', `Test 14: Ranked diets places PCOS protocol on top for PCOS user`);

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) process.exit(1);


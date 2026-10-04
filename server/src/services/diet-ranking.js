const dietPlansData = require('../nutrition/diet-plans.json');
const {
  getUserConditions,
  getUserAge,
  getUserBmi,
  getBmiCategory,
  getActivityCategory,
} = require('./user-profile');

const CANONICAL_DIETS = dietPlansData.diet_plans;

// Onboarding goal ids -> canonical `clinical_profile.primary_goals` they serve.
const GOAL_TO_CLINICAL_GOALS = {
  lose_weight: ['fat_loss', 'visceral_fat_reduction', 'insulin_sensitivity', 'metabolic_boost', 'appetite_suppression'],
  reduce_belly_fat: ['visceral_fat_reduction', 'insulin_sensitivity', 'fat_loss', 'hepatic_lipid_reduction'],
  gain_muscle: ['muscle_protein_synthesis', 'lean_weight_gain', 'energy_availability_restoration'],
  body_recomposition: ['muscle_protein_synthesis', 'fat_loss', 'metabolic_rate_preservation'],
  maintain: ['cardiovascular_longevity', 'systemic_anti_inflammatory', 'heart_health', 'energy_recovery'],
  general_health: ['cardiovascular_longevity', 'systemic_anti_inflammatory', 'antioxidant_support', 'microbiome_support', 'heart_health'],
  blood_sugar: ['glycemic_control', 'insulin_sensitivity', 'rapid_glycemic_drop'],
  blood_pressure: ['blood_pressure_support', 'vascular_tone', 'heart_health'],
};

// Onboarding condition ids -> canonical `clinical_profile.suitable_conditions`.
const CONDITION_TO_CLINICAL = {
  diabetes: ['type_2_diabetes', 'insulin_resistance', 'stubborn_insulin_resistance'],
  prediabetes: ['prediabetes', 'insulin_resistance', 'mild_insulin_resistance', 'metabolic_syndrome'],
  hypertension: ['hypertension', 'mild_hypertension', 'cardiovascular_risk'],
  pcos: ['pcos', 'irregular_cycles'],
  thyroid: ['hypothyroidism', 'hashimotos', 'sluggish_metabolism'],
  high_cholesterol: ['high_cholesterol', 'dyslipidemia', 'cardiovascular_risk'],
  fatty_liver: ['nafld_fatty_liver', 'elevated_liver_enzymes'],
  ibs: ['mild_ibs', 'bloating', 'constipation'],
  gerd: ['indigestion', 'bloating'],
  anemia: ['iron_deficiency_anemia', 'low_serum_ferritin', 'chronic_fatigue'],
  pregnancy_breastfeeding: ['breastfeeding_mother', 'postpartum_recovery'],
};

// Conditions where the user should talk to a clinician before any diet change.
const DOCTOR_FLAG_CONDITIONS = ['diabetes', 'kidney_disease', 'liver_disease', 'pregnancy_breastfeeding'];

const KETO_ID = 'deshi_keto';
const FASTING_ID = 'hormone_safe_fasting_14_10';
const HIGH_PROTEIN_ID = 'muscle_recomp';
const MEDITERRANEAN_ID = 'mediterranean_fusion';
const PLANT_FORWARD_ID = 'anti_estrogen';
const WEIGHT_GAIN_ID = 'weight_gain_amenorrhea';

const CONDITION_LABELS = {
  diabetes: 'type 2 diabetes',
  prediabetes: 'prediabetes / insulin resistance',
  hypertension: 'high blood pressure',
  pcos: 'PCOS',
  thyroid: 'thyroid conditions',
  high_cholesterol: 'high cholesterol',
  fatty_liver: 'fatty liver',
  kidney_disease: 'kidney disease',
  liver_disease: 'liver conditions',
  gerd: 'acid reflux',
  ibs: 'IBS / digestive sensitivity',
  anemia: 'iron deficiency',
  pregnancy_breastfeeding: 'pregnancy / breastfeeding',
};

const GOAL_LABELS = {
  lose_weight: 'weight loss',
  reduce_belly_fat: 'reducing belly fat',
  gain_muscle: 'building muscle',
  body_recomposition: 'body recomposition',
  maintain: 'weight maintenance',
  general_health: 'general health',
  blood_sugar: 'blood sugar management',
  blood_pressure: 'blood pressure support',
};

/**
 * Hard eligibility check against the canonical catalog's `eligibility` block.
 * Returns the reason a diet is out of scope for this user, or null when eligible.
 */
function getIneligibilityReason(diet, profile) {
  const eligibility = diet.eligibility || {};
  const gender = profile.gender;
  if (Array.isArray(eligibility.sex) && gender && !eligibility.sex.includes(gender)) {
    return `${diet.name} is designed for ${eligibility.sex.join('/')} physiology.`;
  }
  const age = getUserAge(profile);
  if (age !== null && eligibility.minimum_age && age < eligibility.minimum_age) {
    return `${diet.name} is intended for ages ${eligibility.minimum_age}+.`;
  }
  if (age !== null && eligibility.maximum_age && age > eligibility.maximum_age) {
    return `${diet.name} is intended for ages up to ${eligibility.maximum_age}.`;
  }
  return null;
}

/**
 * Scores the canonical diet catalog for a user profile (onboarding payload or
 * User document). Diets the user is ineligible for are excluded.
 */
function rankDietProtocols(profile = {}) {
  const goal = profile.primaryGoal || 'lose_weight';
  const conditions = getUserConditions(profile);
  const preferences = profile.foodPreferences || [];
  const activity = getActivityCategory(profile);
  const bmiCategory = getBmiCategory(getUserBmi(profile));
  const wantedGoals = GOAL_TO_CLINICAL_GOALS[goal] || [];
  const isPlantBased = preferences.includes('vegan') || preferences.includes('vegetarian');

  const scored = CANONICAL_DIETS.filter((diet) => !getIneligibilityReason(diet, profile)).map((diet) => {
    const clinical = diet.clinical_profile || {};
    const eligibility = diet.eligibility || {};
    const primaryGoals = clinical.primary_goals || [];
    const suitableConditions = clinical.suitable_conditions || [];
    const reviewConditions = clinical.requires_professional_review || [];

    let score = 60;
    const reasons = [];
    const cautionReasons = [];
    const doctorConsultReasons = [];

    // 1. Goal fit
    const goalMatches = primaryGoals.filter((g) => wantedGoals.includes(g)).length;
    if (goalMatches > 0) {
      score += Math.min(20, goalMatches * 8);
      reasons.push(`Directly supports your focus on ${GOAL_LABELS[goal] || goal}.`);
    }

    // 2. Health condition fit
    let conditionBonus = 0;
    conditions.forEach((cond) => {
      const clinicalMatches = CONDITION_TO_CLINICAL[cond] || [];
      if (clinicalMatches.some((c) => suitableConditions.includes(c))) {
        conditionBonus += 18;
        reasons.push(`Clinically designed around ${CONDITION_LABELS[cond] || cond}.`);
      }
      if (clinicalMatches.some((c) => reviewConditions.includes(c))) {
        doctorConsultReasons.push(
          `For ${CONDITION_LABELS[cond] || cond}, please consult a physician or clinical dietitian before starting ${diet.name}.`
        );
      }
    });
    score += Math.min(36, conditionBonus);

    // 3. Body composition & activity eligibility (soft penalties)
    if (bmiCategory && Array.isArray(eligibility.bmi) && !eligibility.bmi.includes(bmiCategory)) {
      score -= 20;
      cautionReasons.push(`Not typically recommended for a ${bmiCategory} BMI range.`);
    }
    if (activity && Array.isArray(eligibility.activity_levels) && !eligibility.activity_levels.includes(activity)) {
      score -= 10;
      cautionReasons.push('Designed for a different activity level than yours.');
    }
    if (bmiCategory === 'underweight' && diet.id === WEIGHT_GAIN_ID) {
      score += 25;
      reasons.push('Prioritizes safe, nourishing weight restoration for a low BMI.');
    }

    // 4. Food preferences
    if (preferences.includes('low_carb') && (diet.id === KETO_ID || diet.id === 'deshi_low_gi_insulin_resistance')) {
      score += 12;
      reasons.push('Matches your preference for carb-conscious eating.');
    } else if (!preferences.includes('low_carb') && diet.id === KETO_ID) {
      score -= 20;
      cautionReasons.push('Very low-carb and restrictive; best suited to people who prefer low-carb eating.');
    }
    if (preferences.includes('high_protein') && diet.id === HIGH_PROTEIN_ID) {
      score += 12;
      reasons.push('High protein density to support lean tissue and satiety.');
    }
    if (isPlantBased) {
      if (diet.id === PLANT_FORWARD_ID) {
        score += 15;
        reasons.push('Plant-forward pattern aligned with your vegetarian/vegan preference.');
      } else if (diet.id === KETO_ID || diet.id === HIGH_PROTEIN_ID) {
        score -= 20;
        cautionReasons.push('Relies heavily on animal protein, which conflicts with a plant-based preference.');
      }
    }
    if ((goal === 'general_health' || goal === 'maintain') && conditions.length === 0 && diet.id === MEDITERRANEAN_ID) {
      score += 10;
      reasons.push('A well-evidenced, balanced pattern for long-term health.');
    }
    if ((activity === 'high') && diet.id === HIGH_PROTEIN_ID) {
      score += 8;
      reasons.push('Supports recovery for your high training volume.');
    }

    // 5. Safety: contraindications and clinician review
    if (conditions.includes('kidney_disease') && (diet.id === HIGH_PROTEIN_ID || diet.id === KETO_ID)) {
      score -= 40;
      cautionReasons.push('High-protein / ketogenic loads can stress impaired kidney function.');
      doctorConsultReasons.push('Kidney conditions require individualized protein management by a nephrologist.');
    }
    if (conditions.includes('pregnancy_breastfeeding') && (diet.id === KETO_ID || diet.id === FASTING_ID)) {
      score -= 40;
      cautionReasons.push('Ketosis and fasting are not advised during pregnancy or breastfeeding.');
      doctorConsultReasons.push('Pregnancy and breastfeeding need adequate carbohydrate and nutrient density.');
    }
    if (conditions.includes('diabetes') && (diet.id === KETO_ID || diet.id === FASTING_ID)) {
      score -= 15;
      doctorConsultReasons.push('Low-carb or fasting with diabetes medication can cause hypoglycemia; confirm with your doctor.');
    }
    if (bmiCategory === 'underweight' && (diet.id === KETO_ID || diet.id === FASTING_ID)) {
      score -= 40;
      cautionReasons.push('Restrictive or fasting protocols are not suitable for a low BMI.');
    }
    if (diet.safety && diet.safety.medical_review_required) {
      doctorConsultReasons.push(`${diet.name} should be started under medical supervision.`);
    }
    conditions
      .filter((cond) => DOCTOR_FLAG_CONDITIONS.includes(cond))
      .forEach((cond) => {
        const message = `Because of ${CONDITION_LABELS[cond] || cond}, review any diet change with your doctor.`;
        if (!doctorConsultReasons.includes(message)) doctorConsultReasons.push(message);
      });

    if (diet.isFeatured) score += 3;
    // Tie-breaker: the balanced Mediterranean pattern is the safest generic default.
    if (diet.id === MEDITERRANEAN_ID) score += 2;

    return {
      id: diet.id,
      slug: diet.slug,
      name: diet.name,
      tagline: diet.tagline,
      icon: diet.icon,
      rawScore: score,
      score: Math.min(99, Math.max(35, Math.round(score))),
      tier: 'Alternative',
      macroRatio: diet.macroRatio,
      reasons: [...new Set(reasons)].slice(0, 4),
      cautionReasons: [...new Set(cautionReasons)].slice(0, 3),
      requiresDoctorConsult: doctorConsultReasons.length > 0,
      doctorConsultReasons: [...new Set(doctorConsultReasons)],
    };
  });

  scored.sort((a, b) => b.rawScore - a.rawScore);
  return scored.map(({ rawScore, ...item }, index) => ({
    ...item,
    tier: index === 0 ? 'Best Match' : index <= 2 ? 'Good Match' : 'Alternative',
  }));
}

module.exports = {
  CANONICAL_DIETS,
  KETO_ID,
  PLANT_FORWARD_ID,
  getIneligibilityReason,
  rankDietProtocols,
};

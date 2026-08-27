const mongoose = require('mongoose');

const MacroRangeSchema = new mongoose.Schema(
  {
    min: { type: Number },
    max: { type: Number },
  },
  { _id: false }
);

const MacroRatioSchema = new mongoose.Schema(
  {
    mode: { type: String, default: 'target_range' },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    protein_percent: { type: MacroRangeSchema },
    carbohydrate_percent: { type: MacroRangeSchema },
    fat_percent: { type: MacroRangeSchema },
  },
  { _id: false }
);

const EvidenceProfileSchema = new mongoose.Schema(
  {
    mechanism_summary: { type: String, default: '' },
    potential_benefits: { type: [String], default: [] },
    evidence_level: {
      type: String,
      enum: ['strong', 'moderate', 'limited', 'emerging', 'traditional'],
      default: 'moderate',
    },
  },
  { _id: false }
);

const ClinicalProfileSchema = new mongoose.Schema(
  {
    primary_goals: { type: [String], default: [] },
    suitable_conditions: { type: [String], default: [] },
    requires_professional_review: { type: [String], default: [] },
  },
  { _id: false }
);

const EligibilitySchema = new mongoose.Schema(
  {
    minimum_age: { type: Number, default: 16 },
    maximum_age: { type: Number, default: null },
    bmi: { type: [String], default: ['normal', 'overweight', 'obesity'] },
    activity_levels: { type: [String], default: ['sedentary', 'light', 'moderate', 'high'] },
  },
  { _id: false }
);

const NutritionStrategySchema = new mongoose.Schema(
  {
    calorie_mode: { type: String, default: 'individualized' },
    protein: { type: String, default: 'moderate' },
    carbohydrate: { type: String, default: 'moderate' },
    fat: { type: String, default: 'moderate' },
    fiber: { type: String, default: 'high' },
    sodium: { type: String, default: 'standard' },
  },
  { _id: false }
);

const FoodRulesSchema = new mongoose.Schema(
  {
    prefer: { type: [String], default: [] },
    limit: { type: [String], default: [] },
    avoid_if_allergic: { type: Boolean, default: true },
  },
  { _id: false }
);

const SafetySchema = new mongoose.Schema(
  {
    automatic_recommendation: { type: Boolean, default: true },
    medical_review_required: { type: Boolean, default: false },
  },
  { _id: false }
);

const SampleMealDaySchema = new mongoose.Schema(
  {
    breakfast: { type: String, required: true },
    lunch: { type: String, required: true },
    dinner: { type: String, required: true },
    snack: { type: String, required: true },
  },
  { _id: false }
);

const SuitabilitySchema = new mongoose.Schema(
  {
    recommendedFor: { type: [String], default: [] },
    contraindications: { type: [String], default: [] },
  },
  { _id: false }
);

const DietPlanSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'general',
    },
    status: {
      type: String,
      default: 'active',
    },
    tagline: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    fullOverview: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'Sparkles',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Advanced', 'Challenging'],
      default: 'Moderate',
    },
    targetAudience: {
      type: String,
      default: '',
    },
    targetWeightCategory: {
      type: String,
      default: '',
    },
    clinical_profile: {
      type: ClinicalProfileSchema,
      default: () => ({ primary_goals: [], suitable_conditions: [], requires_professional_review: [] }),
    },
    eligibility: {
      type: EligibilitySchema,
      default: () => ({ minimum_age: 16, maximum_age: null, bmi: ['normal', 'overweight'], activity_levels: ['moderate'] }),
    },
    nutrition_strategy: {
      type: NutritionStrategySchema,
      default: () => ({ calorie_mode: 'individualized' }),
    },
    food_rules: {
      type: FoodRulesSchema,
      default: () => ({ prefer: [], limit: [], avoid_if_allergic: true }),
    },
    evidence_profile: {
      type: EvidenceProfileSchema,
      default: () => ({ mechanism_summary: '', potential_benefits: [], evidence_level: 'moderate' }),
    },
    safety: {
      type: SafetySchema,
      default: () => ({ automatic_recommendation: true, medical_review_required: false }),
    },
    macroRatio: {
      type: MacroRatioSchema,
      required: true,
    },
    keyBenefits: {
      type: [String],
      default: [],
    },
    allowedFoods: {
      type: [String],
      default: [],
    },
    foodsToLimit: {
      type: [String],
      default: [],
    },
    forbiddenKeywords: {
      type: [String],
      default: [],
    },
    guidelines: {
      type: [String],
      default: [],
    },
    suitability: {
      type: SuitabilitySchema,
      default: () => ({ recommendedFor: [], contraindications: [] }),
    },
    sampleMealDay: {
      type: SampleMealDaySchema,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DietPlan', DietPlanSchema);



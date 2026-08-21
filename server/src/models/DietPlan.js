const mongoose = require('mongoose');

const MacroRatioSchema = new mongoose.Schema(
  {
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
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

const DietPlanSchema = new mongoose.Schema(
  {
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
      enum: ['Easy', 'Moderate', 'Advanced'],
      default: 'Moderate',
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

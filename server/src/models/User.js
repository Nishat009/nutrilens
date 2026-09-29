const mongoose = require('mongoose');

const UserGoalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'lose_weight',
      'reduce_belly_fat',
      'gain_muscle',
      'body_recomposition',
      'maintain',
      'general_health',
      'blood_sugar',
      'blood_pressure',
    ],
    default: 'lose_weight',
  },
  targetCalories: { type: Number, default: 2150 },
  targetProteinG: { type: Number, default: 160 },
  targetCarbsG: { type: Number, default: 210 },
  targetFatG: { type: Number, default: 65 },
  targetFiberG: { type: Number, default: 32 },
  targetWaterMl: { type: Number, default: 3000 },
  weeklyWeightChangeKg: { type: Number, default: -0.5 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      default: 'password123',
      select: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    dob: {
      type: String,
      default: '1998-05-14',
    },
    heightCm: {
      type: Number,
      default: 178,
    },
    weightKg: {
      type: Number,
      default: 74.5,
    },
    targetWeightKg: {
      type: Number,
      default: 72.0,
    },
    waistCm: {
      type: Number,
    },
    activityLevel: {
      type: String,
      enum: [
        'sedentary',
        'lightly_active',
        'moderately_active',
        'very_active',
        'extra_active',
      ],
      default: 'moderately_active',
    },
    primaryGoal: {
      type: String,
      default: 'lose_weight',
    },
    goalPace: {
      type: String,
      enum: ['slow_sustainable', 'moderate', 'faster'],
      default: 'moderate',
    },
    healthConditions: {
      type: [String],
      default: [],
    },
    foodPreferences: {
      type: [String],
      default: ['balanced', 'traditional_bangladeshi'],
    },
    commonFoodsEaten: {
      type: [String],
      default: ['Rice', 'Roti', 'Dal', 'Fish', 'Chicken', 'Egg', 'Vegetables'],
    },
    activeDietId: { type: String },
    medicalConditions: { type: [String], default: [] },
    medications: { type: [String], default: [] },
    allergies: {
      type: [String],
      default: [],
    },
    lifestyle: {
      sleepHours: { type: String, default: '6_to_8' },
      workType: { type: String, default: 'desk_job' },
      mealFrequency: { type: Number, default: 3 },
      cookingHabit: { type: String, default: 'family_cooks' },
      budgetLevel: { type: String, default: 'medium' },
    },
    dietaryPreferences: {
      type: [String],
      default: ['High Protein / Gym', 'Mediterranean'],
    },
    avatarUrl: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    },
    goal: {
      type: UserGoalSchema,
      default: () => ({}),
    },
    personalizedPlan: {
      type: mongoose.Schema.Types.Mixed,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('User', UserSchema);

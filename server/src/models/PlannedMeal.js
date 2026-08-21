const mongoose = require('mongoose');

const PlannedMealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number, // 0 = Mon, 1 = Tue, ..., 6 = Sun
      required: true,
      min: 0,
      max: 6,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    calories: {
      type: Number,
      required: true,
      default: 0,
    },
    protein: {
      type: Number,
      required: true,
      default: 0,
    },
    carbs: {
      type: Number,
      required: true,
      default: 0,
    },
    fat: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

PlannedMealSchema.index({ userId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('PlannedMeal', PlannedMealSchema);

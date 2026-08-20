const mongoose = require('mongoose');

const MealItemSchema = new mongoose.Schema({
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: false,
  },
  foodName: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  protein: {
    type: Number,
    required: true,
  },
  carbs: {
    type: Number,
    required: true,
  },
  fat: {
    type: Number,
    required: true,
  },
  fiber: {
    type: Number,
    default: 0,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1.0,
  },
});

const MealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    time: {
      type: String, // Format: HH:mm
      required: true,
    },
    totalCalories: {
      type: Number,
      required: true,
      default: 0,
    },
    totalProtein: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCarbs: {
      type: Number,
      required: true,
      default: 0,
    },
    totalFat: {
      type: Number,
      required: true,
      default: 0,
    },
    totalFiber: {
      type: Number,
      default: 0,
    },
    items: [MealItemSchema],
    imageUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Meal', MealSchema);

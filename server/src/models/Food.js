const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a food name'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    servingSize: {
      type: Number,
      required: true,
      default: 100,
    },
    servingUnit: {
      type: String,
      required: true,
      default: 'g',
    },
    nutrition: {
      calories: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fat: { type: Number, required: true },
      fiber: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 },
    },
    imageUrl: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

FoodSchema.index({ name: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('Food', FoodSchema);

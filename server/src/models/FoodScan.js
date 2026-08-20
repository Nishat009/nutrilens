const mongoose = require('mongoose');

const DetectedItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  confidence: { type: Number, required: true },
  estimatedQuantity: { type: Number, required: true },
  unit: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number, default: 0 },
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
});

const FoodScanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['uploading', 'identifying', 'estimating', 'calculating', 'completed', 'failed'],
      default: 'completed',
    },
    suggestedMealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      default: 'lunch',
    },
    analysisNotes: {
      type: String,
      default: '',
    },
    totalCalories: { type: Number, required: true, default: 0 },
    totalProtein: { type: Number, required: true, default: 0 },
    totalCarbs: { type: Number, required: true, default: 0 },
    totalFat: { type: Number, required: true, default: 0 },
    totalFiber: { type: Number, default: 0 },
    detectedItems: [DetectedItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FoodScan', FoodScanSchema);

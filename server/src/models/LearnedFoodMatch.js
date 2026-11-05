const mongoose = require('mongoose');

const LearnedFoodMatchSchema = new mongoose.Schema(
  {
    // Each member teaches their own visual memory; matches are never shared across accounts.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    foodId: {
      type: String,
      required: true,
      index: true,
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Vegetables',
    },
    perceptualHash: {
      type: String,
      required: true,
      index: true,
    },
    colorSignature: {
      type: [Number],
      default: [],
    },
    sampleThumbnail: {
      type: String,
      default: '',
    },
    confidenceScore: {
      type: Number,
      default: 0.99,
    },
    learnedCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LearnedFoodMatch', LearnedFoodMatchSchema);

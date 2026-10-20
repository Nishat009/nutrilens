const mongoose = require('mongoose');

const WeightLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    weightKg: {
      type: Number,
      required: true,
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

WeightLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WeightLog', WeightLogSchema);

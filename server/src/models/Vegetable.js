const mongoose = require('mongoose');

const VegetableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vegetable name is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Vegetable slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    visualDescription: {
      type: String,
      default: '',
      trim: true,
    },
    dominantColor: {
      type: String,
      default: 'green',
    },
    secondaryColors: {
      type: [String],
      default: [],
    },
    shape: {
      type: String,
      default: 'irregular',
    },
    pieceWeightGrams: {
      type: Number,
      default: 100,
    },
    caloriesPerPiece: {
      type: Number,
      default: 0,
    },
    pieceUnitLabel: {
      type: String,
      default: '1 medium piece (~100g)',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Root Vegetables',
        'Leafy Greens',
        'Cruciferous',
        'Nightshades',
        'Gourds & Squashes',
        'Podded & Legumes',
        'Allium',
        'Mushroom & Fungi',
        'Stems & Shoots',
        'Fruit Vegetables',
        'Tubers & Corms',
        'Herbs & Aromatics',
      ],
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
      default: '/vegetables/default-vegetable.webp',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    // Standard baseline: RAW edible portion per 100g
    caloriesPer100g: {
      type: Number,
      required: [true, 'Calories per 100g is required'],
      min: 0,
    },
    proteinPer100g: {
      type: Number,
      required: [true, 'Protein per 100g is required'],
      min: 0,
    },
    carbsPer100g: {
      type: Number,
      required: [true, 'Carbohydrates per 100g is required'],
      min: 0,
    },
    fatPer100g: {
      type: Number,
      required: [true, 'Fat per 100g is required'],
      min: 0,
    },
    fiberPer100g: {
      type: Number,
      required: [true, 'Fiber per 100g is required'],
      min: 0,
    },
    // Optional micronutrients per 100g raw edible portion
    sugarPer100g: {
      type: Number,
      default: 0,
      min: 0,
    },
    sodiumMg: {
      type: Number,
      default: 0,
      min: 0,
    },
    potassiumMg: {
      type: Number,
      default: 0,
      min: 0,
    },
    vitaminCMg: {
      type: Number,
      default: 0,
      min: 0,
    },
    vitaminAIU: {
      type: Number,
      default: 0,
      min: 0,
    },
    calciumMg: {
      type: Number,
      default: 0,
      min: 0,
    },
    ironMg: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Metadata standard fields
    servingSize: {
      type: Number,
      default: 100,
    },
    servingUnit: {
      type: String,
      default: 'g',
    },
    preparationState: {
      type: String,
      default: 'raw',
    },
    source: {
      type: String,
      default: 'USDA FoodData Central',
    },
    sourceReference: {
      type: String,
      default: 'USDA FoodData Central / SR Legacy (Raw Edible Portion per 100g)',
    },
    scientificName: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound text index for search
VegetableSchema.index(
  {
    name: 'text',
    aliases: 'text',
    description: 'text',
    category: 'text',
  },
  {
    weights: {
      name: 10,
      aliases: 8,
      category: 4,
      description: 1,
    },
    name: 'vegetable_text_search',
  }
);

module.exports = mongoose.model('Vegetable', VegetableSchema);

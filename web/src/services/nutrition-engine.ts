import { DatabaseFoodItem, NUTRITION_DATABASE } from '../data/nutrition-database';

export interface CalculatedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface NutritionResultItem {
  id: string;
  foodId: string;
  vegetableId?: string;
  vegetableSlug?: string;
  isVegetableMatch?: boolean;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  source?: string;
  sourceReference?: string;
  preparationState?: string;
  standardNotice?: string;
  suggestions?: string[];
  imageUrl?: string;
  // Visual botanical features & Piece-based metrics
  visualDescription?: string;
  pieceWeightGrams?: number;
  caloriesPerPiece?: number;
  pieceUnitLabel?: string;
  visualMatchConfidence?: number;
  visualMatchExplanation?: string;
}

/**
 * Calculates exact nutritional values for a given food item and quantity in grams/ml.
 * Formula: value = (per100g * quantity) / 100
 */
export function calculateNutrition(
  food: Pick<DatabaseFoodItem, 'caloriesPer100g' | 'proteinPer100g' | 'carbsPer100g' | 'fatPer100g' | 'fiberPer100g'>,
  quantityGrams: number
): CalculatedNutrition {
  const validQty = Math.max(0, quantityGrams);
  const factor = validQty / 100;

  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    fiber: Math.round(food.fiberPer100g * factor * 10) / 10,
  };
}

/**
 * Sums an array of items to get total meal macros
 */
export function calculateTotalNutrition(
  items: Array<{ calories: number; protein: number; carbs: number; fat: number; fiber: number }>
): CalculatedNutrition {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: Math.round((acc.protein + (item.protein || 0)) * 10) / 10,
      carbs: Math.round((acc.carbs + (item.carbs || 0)) * 10) / 10,
      fat: Math.round((acc.fat + (item.fat || 0)) * 10) / 10,
      fiber: Math.round((acc.fiber + (item.fiber || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/**
 * Search the nutrition database by keyword and optional category.
 */
export function searchNutritionDatabase(
  query: string,
  category?: string
): DatabaseFoodItem[] {
  if (!query && !category) return NUTRITION_DATABASE.slice(0, 15);

  const cleanQuery = query.toLowerCase().trim();

  return NUTRITION_DATABASE.filter((item) => {
    const matchesCategory = !category || item.category === category;
    if (!cleanQuery) return matchesCategory;

    const matchesName = item.name.toLowerCase().includes(cleanQuery);
    const matchesAlias = item.aliases.some((a) => a.toLowerCase().includes(cleanQuery));
    const matchesTag = item.tags.some((t) => t.toLowerCase().includes(cleanQuery));
    const matchesVisual = (item.visualDescription || '').toLowerCase().includes(cleanQuery);

    return matchesCategory && (matchesName || matchesAlias || matchesTag || matchesVisual);
  });
}

/**
 * Finds the closest matching database food item for a raw model prediction label
 */
export function findBestFoodMatch(rawLabel: string): {
  item: DatabaseFoodItem;
  confidenceScore: number;
  suggestions: string[];
} {
  const cleanLabel = rawLabel.toLowerCase().replace(/[_-]/g, ' ').trim();

  // 1. Exact alias or name match
  for (const food of NUTRITION_DATABASE) {
    if (
      food.name.toLowerCase() === cleanLabel ||
      (food.englishName && food.englishName.toLowerCase() === cleanLabel) ||
      (food.bengaliName && food.bengaliName === cleanLabel) ||
      food.aliases.some((a) => a.toLowerCase() === cleanLabel)
    ) {
      return {
        item: food,
        confidenceScore: 0.96,
        suggestions: getAlternativeSuggestions(food.id),
      };
    }
  }

  // 2. Substring matching
  for (const food of NUTRITION_DATABASE) {
    if (
      food.name.toLowerCase().includes(cleanLabel) ||
      cleanLabel.includes(food.name.toLowerCase()) ||
      (food.englishName && food.englishName.toLowerCase().includes(cleanLabel)) ||
      food.aliases.some((a) => cleanLabel.includes(a.toLowerCase()) || a.toLowerCase().includes(cleanLabel))
    ) {
      return {
        item: food,
        confidenceScore: 0.88,
        suggestions: getAlternativeSuggestions(food.id),
      };
    }
  }

  // 3. Token-based word overlap
  const labelTokens = cleanLabel.split(/\s+/);
  let bestFood: DatabaseFoodItem = NUTRITION_DATABASE[0];
  let maxMatchCount = 0;

  for (const food of NUTRITION_DATABASE) {
    let score = 0;
    const foodTokens = `${food.name} ${food.aliases.join(' ')} ${food.visualDescription || ''}`.toLowerCase().split(/\s+/);
    for (const token of labelTokens) {
      if (token.length > 2 && foodTokens.includes(token)) {
        score++;
      }
    }
    if (score > maxMatchCount) {
      maxMatchCount = score;
      bestFood = food;
    }
  }

  const confidenceScore = maxMatchCount > 0 ? 0.72 : 0.45;
  return {
    item: bestFood,
    confidenceScore,
    suggestions: getAlternativeSuggestions(bestFood.id),
  };
}

function getAlternativeSuggestions(excludeId: string): string[] {
  return NUTRITION_DATABASE.filter((f) => f.id !== excludeId)
    .slice(0, 4)
    .map((f) => f.name);
}

/**
 * Creates a fully formatted NutritionResultItem from a matched food and confidence score
 */
export function buildResultItem(
  food: DatabaseFoodItem,
  confidence: number,
  customPortion?: number
): NutritionResultItem {
  const quantity = customPortion || food.defaultPortion;
  const macros = calculateNutrition(food, quantity);

  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
  if (confidence < 0.50) confidenceLevel = 'low';
  else if (confidence < 0.78) confidenceLevel = 'medium';

  return {
    id: 'det_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    foodId: food.id,
    name: food.name,
    category: food.category,
    quantity,
    unit: food.unit,
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    fiber: macros.fiber,
    confidence: Math.round(confidence * 100) / 100,
    confidenceLevel,
    suggestions: getAlternativeSuggestions(food.id),
    imageUrl: food.imageUrl,
    visualDescription: food.visualDescription,
    pieceWeightGrams: food.pieceWeightGrams,
    caloriesPerPiece: food.caloriesPerPiece,
    pieceUnitLabel: food.pieceUnitLabel,
    visualMatchConfidence: Math.round(confidence * 100),
    visualMatchExplanation: food.visualDescription
      ? `Visual Match (${Math.round(confidence * 100)}%): Matches visual profile — ${food.visualDescription}`
      : undefined,
  };
}

import foods from '../../../server/src/nutrition/nutrition-database.json';

export interface DatabaseFoodItem {
  id: string;
  name: string;
  bengaliName?: string;
  englishName?: string;
  category: string;
  defaultPortion: number; // in grams or ml
  unit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  imageUrl?: string;
  aliases: string[]; // for flexible search and classification mapping
  tags: string[];
  visualDescription?: string;
  pieceWeightGrams?: number;
  caloriesPerPiece?: number;
  pieceUnitLabel?: string;
  visualMatchExplanation?: string;
}

// Shared with the server (server/src/data/nutrition-database.js): one copy of the data, so the
// on-device scanner and the API match the same foods.
export const NUTRITION_DATABASE = foods as unknown as DatabaseFoodItem[];

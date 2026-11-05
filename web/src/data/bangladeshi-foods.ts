import foods from '../../../server/src/nutrition/bangladeshi-foods.json';

export interface BangladeshiFoodItem {
  id: string;
  name: string;
  bengaliName: string;
  category: 'carbs' | 'protein' | 'vegetables' | 'fruits' | 'dairy' | 'fats';
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
  defaultPortionGrams: number;
  householdPortion: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  allergens: ('dairy' | 'egg' | 'fish' | 'seafood' | 'peanut' | 'treenut' | 'gluten' | 'soy')[];
  substitutionGroup: string;
  dietTags: string[];
  giCategory?: 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high';
}

// Shared with the server (server/src/data/bangladeshi-foods.js): one copy of the data.
export const BANGLADESHI_FOODS = foods as unknown as BangladeshiFoodItem[];

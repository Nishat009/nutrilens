export type VegetableCategory =
  | 'All'
  | 'Root Vegetables'
  | 'Leafy Greens'
  | 'Cruciferous'
  | 'Nightshades'
  | 'Gourds & Squashes'
  | 'Podded & Legumes'
  | 'Allium'
  | 'Mushroom & Fungi'
  | 'Stems & Shoots'
  | 'Fruit Vegetables'
  | 'Tubers & Corms'
  | 'Herbs & Aromatics';

export interface VegetableNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  vitaminCMg?: number;
  vitaminAIU?: number;
  calciumMg?: number;
  ironMg?: number;
}

export interface Vegetable {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  aliases: string[];
  description: string;
  visualDescription?: string;
  dominantColor?: string;
  secondaryColors?: string[];
  shape?: string;
  pieceWeightGrams?: number;
  caloriesPerPiece?: number;
  pieceUnitLabel?: string;
  category: string;
  scientificName?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  vitaminCMg?: number;
  vitaminAIU?: number;
  calciumMg?: number;
  ironMg?: number;
  servingSize: number;
  servingUnit: string;
  preparationState: string;
  source: string;
  sourceReference: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalculatedVegetableNutrition {
  vegetableId: string;
  name: string;
  slug: string;
  portionGrams: number;
  unit: string;
  preparationState: string;
  standardNotice: string;
  nutrition: VegetableNutrition;
  source: string;
  sourceReference: string;
}

export interface VegetableMatchResult {
  query: string;
  matched: boolean;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  matchType: 'exact_name' | 'exact_alias' | 'partial_name' | 'partial_alias' | 'none';
  vegetable: Vegetable | null;
}

import { Vegetable, VegetableNutrition } from '../types/vegetable';

/**
 * Pure mathematical utility for calculating exact vegetable nutrition for any gram portion.
 * Standard Baseline: 100g raw edible portion.
 */
export function calculateVegetablePortion(
  vegetable: Vegetable,
  portionGrams: number
): VegetableNutrition {
  const grams = Math.max(1, portionGrams || 100);
  const factor = grams / 100;

  return {
    calories: Math.round(vegetable.caloriesPer100g * factor * 10) / 10,
    protein: Math.round(vegetable.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(vegetable.carbsPer100g * factor * 10) / 10,
    fat: Math.round(vegetable.fatPer100g * factor * 10) / 10,
    fiber: Math.round(vegetable.fiberPer100g * factor * 10) / 10,
    sugar: vegetable.sugarPer100g !== undefined ? Math.round(vegetable.sugarPer100g * factor * 10) / 10 : undefined,
    sodiumMg: vegetable.sodiumMg !== undefined ? Math.round(vegetable.sodiumMg * factor * 10) / 10 : undefined,
    potassiumMg: vegetable.potassiumMg !== undefined ? Math.round(vegetable.potassiumMg * factor * 10) / 10 : undefined,
    vitaminCMg: vegetable.vitaminCMg !== undefined ? Math.round(vegetable.vitaminCMg * factor * 10) / 10 : undefined,
    vitaminAIU: vegetable.vitaminAIU !== undefined ? Math.round(vegetable.vitaminAIU * factor) : undefined,
    calciumMg: vegetable.calciumMg !== undefined ? Math.round(vegetable.calciumMg * factor * 10) / 10 : undefined,
    ironMg: vegetable.ironMg !== undefined ? Math.round(vegetable.ironMg * factor * 10) / 10 : undefined,
  };
}

/**
 * Computes caloric contribution percentage for Protein (4 kcal/g), Carbs (4 kcal/g), Fat (9 kcal/g).
 */
export function getMacroPercentages(proteinG: number, carbsG: number, fatG: number) {
  const proteinKcal = (proteinG || 0) * 4;
  const carbsKcal = (carbsG || 0) * 4;
  const fatKcal = (fatG || 0) * 9;
  const totalKcal = proteinKcal + carbsKcal + fatKcal;

  if (totalKcal <= 0) {
    return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
  }

  return {
    proteinPct: Math.round((proteinKcal / totalKcal) * 100),
    carbsPct: Math.round((carbsKcal / totalKcal) * 100),
    fatPct: Math.round((fatKcal / totalKcal) * 100),
  };
}

export function formatGrams(val: number): string {
  if (val === undefined || val === null) return '0';
  return Number.isInteger(val) ? val.toString() : val.toFixed(1);
}

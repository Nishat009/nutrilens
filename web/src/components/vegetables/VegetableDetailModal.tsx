'use client';

import React, { useState } from 'react';
import { Vegetable } from '../../lib/types/vegetable';
import { calculateVegetablePortion, getMacroPercentages, formatGrams } from '../../lib/utils/nutrition-calculator';
import { useMealStore } from '../../lib/stores/meal-store';
import {
  X,
  Flame,
  Plus,
  Minus,
  Scale,
  Check,
  Sparkles,
  BookOpen,
  UtensilsCrossed,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils/format';

interface VegetableDetailModalProps {
  vegetable: Vegetable | null;
  onClose: () => void;
}

const PRESET_PORTIONS = [25, 50, 100, 150, 200, 500];

export function VegetableDetailModal({ vegetable, onClose }: VegetableDetailModalProps) {
  const [grams, setGrams] = useState<number>(100);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [isAdded, setIsAdded] = useState(false);

  const addMeal = useMealStore((state) => state.addMeal);

  if (!vegetable) return null;

  const nutrition = calculateVegetablePortion(vegetable, grams);
  const { proteinPct, carbsPct, fatPct } = getMacroPercentages(
    nutrition.protein,
    nutrition.carbs,
    nutrition.fat
  );

  const handlePortionChange = (newGrams: number) => {
    setGrams(Math.max(5, Math.min(2000, newGrams)));
    setIsAdded(false);
  };

  const handleAddToMeal = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0, 5);

    try {
      await addMeal({
        userId: 'current_user',
        type: selectedMealType,
        date: todayStr,
        time: timeStr,
        totalCalories: Math.round(nutrition.calories),
        totalProtein: nutrition.protein,
        totalCarbs: nutrition.carbs,
        totalFat: nutrition.fat,
        totalFiber: nutrition.fiber,
        items: [
          {
            id: `veg_item_${Date.now()}`,
            foodName: `${vegetable.name} (Raw)`,
            quantity: grams,
            unit: 'g',
            calories: Math.round(nutrition.calories),
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            fiber: nutrition.fiber,
          },
        ],
        notes: `Added from Dedicated USDA Vegetable Database (${grams}g raw portion)`,
      });

      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to log vegetable meal:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              {vegetable.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> USDA Verified Database
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{vegetable.name}</h2>
            {vegetable.scientificName && (
              <p className="text-xs text-slate-400 italic mt-0.5">{vegetable.scientificName}</p>
            )}
          </div>

          {/* Regional Aliases */}
          {vegetable.aliases && vegetable.aliases.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-slate-400 mr-1 self-center">Known as:</span>
              {vegetable.aliases.map((alias, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800/90 text-slate-200 border border-slate-700/60 font-medium"
                >
                  {alias}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed pt-1">
            {vegetable.description}
          </p>
        </div>

        {/* Standard Nutrition Disclaimer Banner */}
        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-300/90 flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-300">
              Standard Baseline: Raw, edible portion per 100g
            </p>
            <p className="text-slate-400 text-[11px]">
              {vegetable.sourceReference || 'USDA FoodData Central / SR Legacy'}. Estimated values may vary depending on variety, soil, and preparation.
            </p>
          </div>
        </div>

        {/* Interactive Quantity Stepper & Calculator */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Adjust Portion
              </span>
              <span className="text-sm font-medium text-slate-200">
                Recalculates calories & macros dynamically
              </span>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-700/80 rounded-xl p-1">
              <button
                type="button"
                onClick={() => handlePortionChange(grams - 25)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                title="Decrease 25g"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2 font-mono">
                <input
                  type="number"
                  min="5"
                  max="2000"
                  value={grams}
                  onChange={(e) => handlePortionChange(parseInt(e.target.value, 10) || 100)}
                  className="w-14 bg-transparent text-center text-lg font-black text-white focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-bold">g</span>
              </div>

              <button
                type="button"
                onClick={() => handlePortionChange(grams + 25)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                title="Increase 25g"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-slate-400 self-center mr-1 font-medium">Quick pick:</span>
            {PRESET_PORTIONS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePortionChange(preset)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-colors border',
                  grams === preset
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                )}
              >
                {preset}g
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Calculated Nutrition Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Nutrition Breakdown ({grams}g)
            </h4>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400">{formatGrams(nutrition.calories)}</span>
              <span className="text-xs text-slate-400 font-bold ml-1">kcal</span>
            </div>
          </div>

          {/* Macro Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-sky-500/20 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-sky-400 block">Protein</span>
              <span className="text-lg font-black text-white">{formatGrams(nutrition.protein)}g</span>
              <span className="text-[10px] text-slate-400 block">({proteinPct}% kcal)</span>
            </div>
            <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Carbohydrates</span>
              <span className="text-lg font-black text-white">{formatGrams(nutrition.carbs)}g</span>
              <span className="text-[10px] text-slate-400 block">({carbsPct}% kcal)</span>
            </div>
            <div className="bg-slate-950/60 border border-rose-500/20 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Total Fat</span>
              <span className="text-lg font-black text-white">{formatGrams(nutrition.fat)}g</span>
              <span className="text-[10px] text-slate-400 block">({fatPct}% kcal)</span>
            </div>
            <div className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Dietary Fiber</span>
              <span className="text-lg font-black text-white">{formatGrams(nutrition.fiber)}g</span>
              <span className="text-[10px] text-emerald-400/80 block">Prebiotic</span>
            </div>
          </div>

          {/* Secondary Micronutrients Grid */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Sugar</span>
              <span className="font-bold text-slate-200">{nutrition.sugar !== undefined ? `${formatGrams(nutrition.sugar)}g` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Potassium</span>
              <span className="font-bold text-slate-200">{nutrition.potassiumMg !== undefined ? `${formatGrams(nutrition.potassiumMg)}mg` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Vitamin C</span>
              <span className="font-bold text-slate-200">{nutrition.vitaminCMg !== undefined ? `${formatGrams(nutrition.vitaminCMg)}mg` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Vitamin A</span>
              <span className="font-bold text-slate-200">{nutrition.vitaminAIU !== undefined ? `${nutrition.vitaminAIU} IU` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Calcium</span>
              <span className="font-bold text-slate-200">{nutrition.calciumMg !== undefined ? `${formatGrams(nutrition.calciumMg)}mg` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Iron</span>
              <span className="font-bold text-slate-200">{nutrition.ironMg !== undefined ? `${formatGrams(nutrition.ironMg)}mg` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Add to Meal Log Action */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Meal Type Select */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <UtensilsCrossed className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value as any)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleAddToMeal}
            className={cn(
              'w-full sm:w-auto px-6 py-2.5 font-bold transition-all',
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20'
            )}
          >
            {isAdded ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Added to Today's Diary!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Log {grams}g {vegetable.name}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

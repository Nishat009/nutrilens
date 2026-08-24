'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Flame } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DatabaseFoodItem, NUTRITION_DATABASE } from '../../data/nutrition-database';
import { searchNutritionDatabase } from '../../services/nutrition-engine';
import { foodApi } from '../../services/api-client';
import { vegetableApi } from '../../services/vegetable-api';


interface FoodSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: DatabaseFoodItem) => void;
  title?: string;
}

const CATEGORIES = [
  'All',
  'South Asian Dishes',
  'Protein',
  'Grains & Carbs',
  'Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Fats & Oils',
];

export function FoodSearch({
  isOpen,
  onClose,
  onSelectFood,
  title = 'Search Nutrition Database',
}: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [foods, setFoods] = useState<DatabaseFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const cat = selectedCategory === 'All' ? undefined : selectedCategory;

    // Search both dedicated Vegetable database and general foods
    Promise.all([
      vegetableApi.searchVegetables(query).catch(() => []),
      foodApi.getFoods({ search: query || undefined, category: cat }).catch(() => []),
    ])
      .then(([vegs, backendFoods]) => {
        const vegItems: DatabaseFoodItem[] = (vegs || []).map((v) => ({
          id: `veg_${v._id || v.slug}`,
          name: `${v.name} (USDA Raw)`,
          category: 'Vegetables',
          defaultPortion: 100,
          unit: 'g',
          caloriesPer100g: v.caloriesPer100g,
          proteinPer100g: v.proteinPer100g,
          carbsPer100g: v.carbsPer100g,
          fatPer100g: v.fatPer100g,
          fiberPer100g: v.fiberPer100g,
          aliases: v.aliases || [],
          tags: ['USDA Raw', v.category, ...(v.aliases || [])],
          imageUrl: v.imageUrl,
        }));

        const foodItems: DatabaseFoodItem[] = (backendFoods || []).map((f) => ({
          id: f.id,
          name: f.name,
          category: (f.category as any) || 'General',
          defaultPortion: f.servingSize || 100,
          unit: f.servingUnit || 'g',
          caloriesPer100g: f.nutrition?.calories || 0,
          proteinPer100g: f.nutrition?.protein || 0,
          carbsPer100g: f.nutrition?.carbs || 0,
          fatPer100g: f.nutrition?.fat || 0,
          fiberPer100g: f.nutrition?.fiber || 0,
          aliases: f.tags || [],
          tags: f.tags || [],
          imageUrl: f.imageUrl,
        }));

        // Prioritize dedicated vegetables if in Vegetable category or matching
        const combined = selectedCategory === 'Vegetables'
          ? [...vegItems, ...foodItems]
          : [...vegItems, ...foodItems];

        if (combined.length > 0) {
          setFoods(combined);
        } else {
          setFoods(searchNutritionDatabase(query, cat));
        }
        setIsLoading(false);
      })
      .catch(() => {
        setFoods(searchNutritionDatabase(query, cat));
        setIsLoading(false);
      });
  }, [query, selectedCategory, isOpen]);

  const handleSelect = (food: DatabaseFoodItem) => {
    onSelectFood(food);
    onClose();
    setQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
      <div className="space-y-4">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search food by name (e.g. Chicken, Rice, Dal, Beef, Egg)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Searching database...</p>
            </div>
          ) : foods.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching foods found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            foods.map((food) => (
              <div
                key={food.id}
                onClick={() => handleSelect(food)}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      <Flame className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                      {food.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="text-slate-300 font-semibold">
                        {food.caloriesPer100g} kcal / 100g
                      </span>
                      <span>•</span>
                      <span className="text-purple-400">{food.proteinPer100g}g P</span>
                      <span className="text-amber-400">{food.carbsPer100g}g C</span>
                      <span className="text-rose-400">{food.fatPer100g}g F</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Select ${food.name}`}
                  className="px-3 py-1 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-400 group-hover:text-slate-950 font-bold text-xs border border-emerald-500/20 transition-all shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Select
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

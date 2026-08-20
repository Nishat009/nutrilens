'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DetectedFoodItem } from './DetectedFoodItem';
import { NutritionSummary } from './NutritionSummary';
import { FoodSearch } from './FoodSearch';
import { AddMealModal } from './AddMealModal';
import { DatabaseFoodItem } from '../../data/nutrition-database';
import {
  calculateNutrition,
  calculateTotalNutrition,
  NutritionResultItem,
  buildResultItem,
} from '../../services/nutrition-engine';
import { FoodRecognitionResult } from '../../services/food-recognition';
import { useMealStore } from '../../lib/stores/meal-store';
import { MealType } from '../../lib/types';

interface FoodAnalysisResultProps {
  image: string;
  initialResult: FoodRecognitionResult;
  onReset: () => void;
}

export function FoodAnalysisResult({
  image,
  initialResult,
  onReset,
}: FoodAnalysisResultProps) {
  const router = useRouter();
  const { addMeal } = useMealStore();

  const [items, setItems] = useState<NutritionResultItem[]>(initialResult.detectedFoods);
  const [isAddSearchOpen, setIsAddSearchOpen] = useState(false);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);

  // Recalculate totals dynamically whenever items or portions change
  const totals = calculateTotalNutrition(items);

  // Update portion quantity of an item
  const handleUpdatePortion = (id: string, newQuantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const ratio = newQuantity / (item.quantity || 1);
        return {
          ...item,
          quantity: newQuantity,
          calories: Math.round(item.calories * ratio),
          protein: Math.round(item.protein * ratio * 10) / 10,
          carbs: Math.round(item.carbs * ratio * 10) / 10,
          fat: Math.round(item.fat * ratio * 10) / 10,
          fiber: Math.round(item.fiber * ratio * 10) / 10,
        };
      })
    );
  };

  // Replace item with a new food chosen from manual search
  const handleReplaceFood = (id: string, newFood: DatabaseFoodItem) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return buildResultItem(newFood, 1.0, item.quantity || newFood.defaultPortion);
      })
    );
  };

  // Remove an item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Add a newly searched food item
  const handleAddNewFood = (food: DatabaseFoodItem) => {
    const newItem = buildResultItem(food, 1.0, food.defaultPortion);
    setItems((prev) => [...prev, newItem]);
  };

  // Confirm and log meal to store & database
  const handleConfirmMeal = async (
    mealType: MealType,
    date: string,
    time: string,
    notes: string
  ) => {
    addMeal({
      userId: 'usr_prantik_99',
      type: mealType,
      date,
      time,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      imageUrl: image,
      notes: notes || initialResult.analysisNotes,
      items: items.map((i) => ({
        id: i.id,
        foodName: i.name,
        quantity: i.quantity,
        unit: i.unit,
        calories: i.calories,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat,
        fiber: i.fiber,
        confidence: i.confidence,
      })),
    });

    // Send asynchronously to backend API if available
    try {
      fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mealType,
          date,
          time,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
          totalFiber: totals.fiber,
          items,
          imageUrl: image,
          notes,
        }),
      }).catch(() => {});
    } catch {}

    router.push('/dashboard');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Recognition Model Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Model: <strong className="text-white">{initialResult.modelName}</strong>
          </span>
          {initialResult.isDemoMode && (
            <Badge variant="amber" size="sm">
              Demo / Free Open Fallback
            </Badge>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Scan Another Photo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Viewport + Macro Summary */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="glass" className="p-4 border-slate-800 space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800 shadow-xl">
              <img src={image} alt="Scanned Food" className="w-full h-full object-cover" />
            </div>

            {/* Nutrition Breakdown Rings & Values */}
            <NutritionSummary
              totalCalories={totals.calories}
              totalProtein={totals.protein}
              totalCarbs={totals.carbs}
              totalFat={totals.fat}
              totalFiber={totals.fiber}
            />

            {/* Analysis Heuristic Notes */}
            {initialResult.analysisNotes && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{initialResult.analysisNotes}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Editable Ingredients, Portion Sliders & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Detected Ingredients</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review, scale portions, or swap items before logging to your daily plan.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddSearchOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Food
              </Button>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <div className="p-8 text-center space-y-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">All detected items removed.</p>
                <Button variant="secondary" size="sm" onClick={() => setIsAddSearchOpen(true)}>
                  Search & Add Food Manually
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <DetectedFoodItem
                    key={item.id}
                    item={item}
                    onUpdatePortion={handleUpdatePortion}
                    onReplaceFood={handleReplaceFood}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            )}

            {/* Add Extra Food Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddSearchOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full border-dashed border-slate-700 py-3"
            >
              Add Another Food Item
            </Button>

            {/* Prominent Medical & Nutrition Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Disclaimer:</strong> {initialResult.disclaimer}
              </span>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <Button
                variant="glow"
                size="lg"
                onClick={() => setIsAddMealModalOpen(true)}
                disabled={items.length === 0}
                className="w-full text-slate-950 font-bold"
                leftIcon={<CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
              >
                Add to Today&apos;s Meals ({totals.calories} kcal)
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Manual Search Modal for Adding Extra Foods */}
      <FoodSearch
        isOpen={isAddSearchOpen}
        onClose={() => setIsAddSearchOpen(false)}
        onSelectFood={handleAddNewFood}
        title="Add Food to Meal"
      />

      {/* Add Meal Slot Confirmation Modal */}
      <AddMealModal
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        onConfirm={handleConfirmMeal}
        defaultMealType={initialResult.suggestedMealType}
        totalCalories={totals.calories}
      />
    </div>
  );
}

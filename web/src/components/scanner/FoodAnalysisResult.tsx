'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertCircle,
  Award,
  ShieldAlert,
  AlertTriangle,
  Search,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DetectedFoodItem } from './DetectedFoodItem';
import { NutritionSummary } from './NutritionSummary';
import { FoodSearch } from './FoodSearch';
import { AddMealModal } from './AddMealModal';
import { DatabaseFoodItem, NUTRITION_DATABASE } from '../../data/nutrition-database';
import {
  calculateNutrition,
  calculateTotalNutrition,
  NutritionResultItem,
  buildResultItem,
} from '../../services/nutrition-engine';
import { FoodRecognitionResult } from '../../services/food-recognition';
import { useMealStore } from '../../lib/stores/meal-store';
import { useUserStore } from '../../lib/stores/user-store';
import { checkDietPlanCompatibility } from '../../services/nutrition';
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
  const { addMeal, getDailyNutritionForDate } = useMealStore();
  const { profile, goal } = useUserStore();

  const [items, setItems] = useState<NutritionResultItem[]>(initialResult.detectedFoods);
  const [isAddSearchOpen, setIsAddSearchOpen] = useState(false);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [learnedFeedback, setLearnedFeedback] = useState<string | null>(null);
  const [manualVegName, setManualVegName] = useState('');

  const activeDietName = profile.dietaryPreferences?.[0] || 'Mediterranean Wellness';

  // Quick manual vegetable search matches
  const quickVegMatches = useMemo(() => {
    if (!manualVegName.trim()) return [];
    const q = manualVegName.toLowerCase().trim();
    return NUTRITION_DATABASE.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.bengaliName?.toLowerCase().includes(q) ||
        f.englishName?.toLowerCase().includes(q) ||
        f.aliases?.some((a) => a.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [manualVegName]);

  // Recalculate totals dynamically whenever items or portions change
  const totals = calculateTotalNutrition(items);

  // Quick select manual vegetable from top bar
  const handleQuickSelectVeg = async (food: DatabaseFoodItem) => {
    const newItem = buildResultItem(food, 1.0, food.defaultPortion);
    // If only 1 item and low confidence, replace it; otherwise append
    if (items.length <= 1) {
      setItems([newItem]);
    } else {
      setItems((prev) => [...prev, newItem]);
    }
    setManualVegName('');

    try {
      const { teachVisualMemory } = await import('../../services/image-fingerprint');
      await teachVisualMemory(image, food);
      setLearnedFeedback(
        `🧠 Saved to visual memory! Next time this image will automatically be recognized as ${food.name}.`
      );
    } catch (err) {
      console.warn('Failed to teach visual memory:', err);
    }
  };

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

  // Replace item with a new food chosen from manual search and teach visual memory
  const handleReplaceFood = async (id: string, newFood: DatabaseFoodItem) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return buildResultItem(newFood, 1.0, item.quantity || newFood.defaultPortion);
      })
    );

    try {
      const { teachVisualMemory } = await import('../../services/image-fingerprint');
      await teachVisualMemory(image, newFood);
      setLearnedFeedback(`🧠 Saved to visual memory! Next time this image will automatically be recognized as ${newFood.name}.`);
    } catch (err) {
      console.warn('Failed to teach visual memory:', err);
    }
  };

  // Remove an item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Add a newly searched food item and teach visual memory
  const handleAddNewFood = async (food: DatabaseFoodItem) => {
    const newItem = buildResultItem(food, 1.0, food.defaultPortion);
    setItems((prev) => [...prev, newItem]);

    try {
      const { teachVisualMemory } = await import('../../services/image-fingerprint');
      await teachVisualMemory(image, food);
      setLearnedFeedback(`🧠 Saved to visual memory! Next time this image will automatically be recognized as ${food.name}.`);
    } catch (err) {
      console.warn('Failed to teach visual memory:', err);
    }
  };

  // Confirm and log meal to store & database
  const handleConfirmMeal = async (
    mealType: MealType,
    date: string,
    time: string,
    notes: string
  ) => {
    try {
      const { scanApi } = await import('../../services/api-client');
      // Save scan record
      scanApi.createScan({
        imageUrl: image,
        status: 'completed',
        suggestedMealType: mealType,
        analysisNotes: notes || initialResult.analysisNotes,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        totalFiber: totals.fiber,
        detectedItems: items.map((i) => ({
          id: i.id,
          name: i.name,
          confidence: i.confidence,
          estimatedQuantity: i.quantity,
          unit: i.unit,
          calories: i.calories,
          protein: i.protein,
          carbs: i.carbs,
          fat: i.fat,
          fiber: i.fiber,
          foodId: i.foodId,
        })),
      }).catch((e) => console.warn('Failed to save scan record:', e));

      // Save meal to database via store
      await addMeal({
        userId: 'current',
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
    } catch (err) {
      console.error('Error saving meal:', err);
    }

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

      {/* Visual Memory Saved Notification */}
      {learnedFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-emerald-500/10">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <span>{learnedFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Viewport + Macro Summary */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="glass" className="p-4 border-slate-800 space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800 shadow-xl">
              <img src={image} alt="Scanned Food" className="w-full h-full object-cover" />
            </div>

            {/* Quick Manual Search & Name Enter Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white">
                  Vegetable not recognized? Type name:
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={manualVegName}
                  onChange={(e) => setManualVegName(e.target.value)}
                  placeholder="Type (e.g. Gajor, Begun, Potol, Lau, Spinach, Broccoli)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {quickVegMatches.length > 0 && (
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1 animate-in fade-in">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pt-1">
                    Click to select & teach AI:
                  </div>
                  {quickVegMatches.map((veg) => (
                    <button
                      key={veg.id}
                      type="button"
                      onClick={() => handleQuickSelectVeg(veg)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-900 flex items-center justify-between text-xs text-slate-200 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-white">{veg.name}</span>
                        {veg.bengaliName && (
                          <span className="text-slate-400 ml-1.5 font-mono">({veg.bengaliName})</span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold">
                        {veg.caloriesPer100g} kcal/100g
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Diet Plan Compliance & Calorie Budget Impact */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Diet: <span className="text-emerald-400">{activeDietName}</span>
                  </span>
                </div>
                <Badge
                  variant={
                    items.some(
                      (i) =>
                        checkDietPlanCompatibility(i.name, 'Vegetables', activeDietName).isViolation
                    )
                      ? 'rose'
                      : 'emerald'
                  }
                  size="sm"
                >
                  {items.some(
                    (i) =>
                      checkDietPlanCompatibility(i.name, 'Vegetables', activeDietName).isViolation
                  )
                    ? 'Violation Detected'
                    : 'Compliant'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {items.map((i) => {
                  const evalResult = checkDietPlanCompatibility(
                    i.name,
                    'Vegetables',
                    activeDietName
                  );
                  return (
                    <span
                      key={i.id}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                        evalResult.isViolation
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {evalResult.tag}: {i.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Diet Violation Warning Alert */}
            {items.some(
              (i) => checkDietPlanCompatibility(i.name, 'Vegetables', activeDietName).isViolation
            ) && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>⚠️ Non-Compliant Food Warning ({activeDietName})</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {items
                    .filter(
                      (i) =>
                        checkDietPlanCompatibility(i.name, 'Vegetables', activeDietName).isViolation
                    )
                    .map((i) => {
                      const evalRes = checkDietPlanCompatibility(
                        i.name,
                        'Vegetables',
                        activeDietName
                      );
                      return (
                        <div
                          key={i.id}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/20 space-y-1"
                        >
                          <div className="font-semibold text-rose-300 text-xs">
                            ❌ {i.name}: {evalRes.clinicalFeedback}
                          </div>
                          {evalRes.alternativeSuggestions.length > 0 && (
                            <div className="text-[11px] text-emerald-400 font-medium">
                              💡 Try instead: {evalRes.alternativeSuggestions.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

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

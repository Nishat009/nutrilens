'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Utensils,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { MEAL_TYPE_CONFIG } from '../../../lib/constants';
import { MealType, PlannedMealSlot } from '../../../lib/types';
import { formatCalories } from '../../../lib/utils/format';
import { plannerApi } from '../../../services/api-client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MealPlannerPage() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMealSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Mon
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New meal modal form state
  const [newMealType, setNewMealType] = useState<MealType>('lunch');
  const [newFoodName, setNewFoodName] = useState('');
  const [newCalories, setNewCalories] = useState('500');
  const [newProtein, setNewProtein] = useState('40');
  const [newCarbs, setNewCarbs] = useState('45');
  const [newFat, setNewFat] = useState('12');

  const loadPlanner = async () => {
    setIsLoading(true);
    try {
      const data = await plannerApi.getPlannedMeals();
      setPlannedMeals(data);
    } catch (err) {
      console.warn('Failed to load planner meals from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlanner();
  }, []);

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName) return;

    setIsSubmitting(true);
    try {
      const created = await plannerApi.addPlannedMeal({
        dayOfWeek: selectedDay,
        mealType: newMealType,
        foodName: newFoodName,
        calories: Number(newCalories) || 400,
        protein: Number(newProtein) || 30,
        carbs: Number(newCarbs) || 40,
        fat: Number(newFat) || 10,
      });

      setPlannedMeals((prev) => [...prev, created]);
      setIsModalOpen(false);
      setNewFoodName('');
    } catch (err) {
      console.error('Failed to add planned meal to backend:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    setPlannedMeals((prev) => prev.filter((p) => p.id !== id));
    try {
      await plannerApi.deletePlannedMeal(id);
    } catch (err) {
      console.error('Failed to delete planned meal from backend:', err);
    }
  };

  const getDayTotalCalories = (dayIdx: number) => {
    return plannedMeals
      .filter((p) => p.dayOfWeek === dayIdx)
      .reduce((acc, curr) => acc + curr.calories, 0);
  };

  const currentDaySlots = plannedMeals.filter((p) => p.dayOfWeek === selectedDay);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Weekly Meal Planner</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Architect your nutrition blueprint directly backed by MongoDB
          </p>
        </div>

        <Button
          variant="glow"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Plan A Meal Slot
        </Button>
      </div>

      {/* Day Selector Pills */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, idx) => {
          const isSelected = selectedDay === idx;
          const totalCal = getDayTotalCalories(idx);

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(idx)}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-xl shadow-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs sm:text-sm font-bold">{day}</div>
              <div className="text-[10px] sm:text-xs font-mono font-semibold text-emerald-400 mt-1">
                {totalCal > 0 ? `${formatCalories(totalCal)} kcal` : '—'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day Meal Slots Detail View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            Planned Schedule for {DAYS[selectedDay]}
          </h3>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Total Day Energy: {formatCalories(getDayTotalCalories(selectedDay))} kcal
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading weekly meal plan...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
              const cfg = MEAL_TYPE_CONFIG[type];
              const slot = currentDaySlots.find((p) => p.mealType === type);

              return (
                <Card
                  key={type}
                  variant="glass"
                  className="p-5 border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-slate-950 text-xs shadow-md"
                        style={{ backgroundColor: cfg.color }}
                      >
                        <Utensils className="w-4 h-4 text-slate-950" />
                      </div>
                      <span className="text-sm font-bold text-white capitalize">{cfg.label}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{cfg.defaultTime}</span>
                  </div>

                  {slot ? (
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-slate-100">{slot.foodName}</div>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          aria-label="Remove meal slot"
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="font-bold text-emerald-400">{slot.calories} kcal</span>
                        <div className="flex items-center gap-2.5 font-mono text-[11px]">
                          <span className="text-purple-400">{slot.protein}g P</span>
                          <span className="text-amber-400">{slot.carbs}g C</span>
                          <span className="text-rose-400">{slot.fat}g F</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setNewMealType(type);
                        setIsModalOpen(true);
                      }}
                      className="p-6 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 text-xs text-slate-400 text-center transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add meal suggestion
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Planned Meal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Planned Meal Slot"
        description={`Planning for ${DAYS[selectedDay]}`}
      >
        <form onSubmit={handleAddMeal} className="space-y-4">
          <Select
            label="Meal Type"
            value={newMealType}
            onChange={(e) => setNewMealType(e.target.value as MealType)}
            options={[
              { label: 'Breakfast', value: 'breakfast' },
              { label: 'Lunch', value: 'lunch' },
              { label: 'Dinner', value: 'dinner' },
              { label: 'Snack / Fuel', value: 'snack' },
            ]}
          />

          <Input
            label="Meal Description / Food Name"
            placeholder="e.g. Grilled Chicken Quinoa Bowl"
            value={newFoodName}
            onChange={(e) => setNewFoodName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Calories"
              type="number"
              value={newCalories}
              onChange={(e) => setNewCalories(e.target.value)}
            />
            <Input
              label="Protein (g)"
              type="number"
              value={newProtein}
              onChange={(e) => setNewProtein(e.target.value)}
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={newCarbs}
              onChange={(e) => setNewCarbs(e.target.value)}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={newFat}
              onChange={(e) => setNewFat(e.target.value)}
            />
          </div>

          <Button type="submit" variant="glow" className="w-full mt-4" isLoading={isSubmitting}>
            Save to Weekly Plan
          </Button>
        </form>
      </Modal>
    </div>
  );
}

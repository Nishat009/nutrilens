'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Utensils,
  CheckCircle2,
  Clock,
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const INITIAL_PLANNED_MEALS: PlannedMealSlot[] = [
  { id: 'p1', dayOfWeek: 0, mealType: 'breakfast', foodName: 'Oatmeal with Whey & Berries', calories: 420, protein: 32, carbs: 54, fat: 8 },
  { id: 'p2', dayOfWeek: 0, mealType: 'lunch', foodName: 'Grilled Salmon Quinoa Bowl', calories: 650, protein: 48, carbs: 62, fat: 18 },
  { id: 'p3', dayOfWeek: 0, mealType: 'dinner', foodName: 'Chicken Sweet Potato Mash', calories: 580, protein: 52, carbs: 50, fat: 12 },
  { id: 'p4', dayOfWeek: 0, mealType: 'snack', foodName: 'Greek Yogurt & Almonds', calories: 240, protein: 20, carbs: 12, fat: 10 },
  
  { id: 'p5', dayOfWeek: 1, mealType: 'breakfast', foodName: 'Poached Eggs & Avocado Toast', calories: 460, protein: 24, carbs: 36, fat: 22 },
  { id: 'p6', dayOfWeek: 1, mealType: 'lunch', foodName: 'Turkey & Brown Rice Skillet', calories: 610, protein: 50, carbs: 60, fat: 14 },
  { id: 'p7', dayOfWeek: 1, mealType: 'dinner', foodName: 'Sirloin Steak with Asparagus', calories: 620, protein: 54, carbs: 20, fat: 24 },
  { id: 'p8', dayOfWeek: 1, mealType: 'snack', foodName: 'Whey Isolate Shake & Banana', calories: 215, protein: 26, carbs: 28, fat: 1 },

  { id: 'p9', dayOfWeek: 2, mealType: 'breakfast', foodName: 'Egg White Frittata with Feta', calories: 380, protein: 35, carbs: 14, fat: 16 },
  { id: 'p10', dayOfWeek: 2, mealType: 'lunch', foodName: 'Mediterranean Tuna Wrap', calories: 540, protein: 44, carbs: 48, fat: 14 },
  { id: 'p11', dayOfWeek: 2, mealType: 'dinner', foodName: 'Herb Chicken with Broccoli', calories: 520, protein: 55, carbs: 24, fat: 12 },
  { id: 'p12', dayOfWeek: 2, mealType: 'snack', foodName: 'Cottage Cheese & Berries', calories: 190, protein: 22, carbs: 16, fat: 3 },
];

export default function MealPlannerPage() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMealSlot[]>(INITIAL_PLANNED_MEALS);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Mon
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New meal modal form state
  const [newMealType, setNewMealType] = useState<MealType>('lunch');
  const [newFoodName, setNewFoodName] = useState('');
  const [newCalories, setNewCalories] = useState('500');
  const [newProtein, setNewProtein] = useState('40');
  const [newCarbs, setNewCarbs] = useState('45');
  const [newFat, setNewFat] = useState('12');

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName) return;

    const newSlot: PlannedMealSlot = {
      id: 'p_' + Date.now().toString(36),
      dayOfWeek: selectedDay,
      mealType: newMealType,
      foodName: newFoodName,
      calories: Number(newCalories) || 400,
      protein: Number(newProtein) || 30,
      carbs: Number(newCarbs) || 40,
      fat: Number(newFat) || 10,
    };

    setPlannedMeals([...plannedMeals, newSlot]);
    setIsModalOpen(false);
    setNewFoodName('');
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
            Architect your nutrition blueprint to ensure seamless macro adherence
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
                    <div className="font-bold text-sm text-slate-100">{slot.foodName}</div>
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

          <Button type="submit" variant="glow" className="w-full mt-4">
            Save to Weekly Plan
          </Button>
        </form>
      </Modal>
    </div>
  );
}

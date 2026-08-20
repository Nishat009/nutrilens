'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Utensils,
  Camera,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useMealStore } from '../../../lib/stores/meal-store';
import { formatDatePretty, formatCalories, formatGrams, getTodayDateString } from '../../../lib/utils/format';
import { MEAL_TYPE_CONFIG } from '../../../lib/constants';
import { MealType } from '../../../lib/types';

export default function MealsPage() {
  const { meals, deleteMeal, getDailyNutritionForDate } = useMealStore();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  const dayMeals = useMemo(() => {
    return meals.filter((m) => m.date === selectedDate);
  }, [meals, selectedDate]);

  const dailyNutrition = useMemo(() => {
    return getDailyNutritionForDate(selectedDate);
  }, [getDailyNutritionForDate, selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === getTodayDateString();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header & Date Picker Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Meal History</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track and review your nutrition diary by date
          </p>
        </div>

        <Link href="/scan">
          <Button variant="glow" size="sm" leftIcon={<Camera className="w-4 h-4" />}>
            Scan New Meal
          </Button>
        </Link>
      </div>

      {/* Date Navigation Bar */}
      <Card variant="glass" className="p-4 flex items-center justify-between border-slate-800">
        <button
          onClick={handlePrevDay}
          aria-label="Previous day"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-base sm:text-lg font-bold text-white flex items-center justify-center gap-2">
            <span>{formatDatePretty(selectedDate)}</span>
            {isToday && <Badge variant="emerald">Today</Badge>}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{selectedDate}</div>
        </div>

        <button
          onClick={handleNextDay}
          aria-label="Next day"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </Card>

      {/* Daily Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Calories</div>
          <div className="text-2xl font-black text-white mt-1">
            {formatCalories(dailyNutrition.totalCalories)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">kcal</div>
        </Card>

        <Card variant="glass" className="p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-purple-400">Total Protein</div>
          <div className="text-2xl font-black text-purple-300 mt-1">
            {formatGrams(dailyNutrition.totalProtein)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">amino load</div>
        </Card>

        <Card variant="glass" className="p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-amber-400">Total Carbs</div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {formatGrams(dailyNutrition.totalCarbs)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">glycogen fuel</div>
        </Card>

        <Card variant="glass" className="p-4 text-center">
          <div className="text-[10px] uppercase font-bold text-rose-400">Total Fat</div>
          <div className="text-2xl font-black text-rose-300 mt-1">
            {formatGrams(dailyNutrition.totalFat)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">essential lipids</div>
        </Card>
      </div>

      {/* Meals List */}
      {dayMeals.length === 0 ? (
        <EmptyState
          icon={<Utensils className="w-8 h-8" />}
          title="No meals logged for this day"
          description="Use the AI camera scanner or log your meal to populate your diary."
          actionText="Scan Food Now"
          onAction={() => window.location.assign('/scan')}
        />
      ) : (
        <div className="space-y-4">
          {dayMeals.map((meal) => {
            const config = MEAL_TYPE_CONFIG[meal.type as MealType];

            return (
              <Card
                key={meal.id}
                variant="glass"
                className="p-5 sm:p-6 border-slate-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-slate-950 shadow-md"
                      style={{ backgroundColor: config?.color || '#10b981' }}
                    >
                      <Utensils className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white capitalize">{config?.label || meal.type}</h3>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Logged at {meal.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-black text-white">{meal.totalCalories} kcal</div>
                      <div className="text-xs text-slate-400">
                        {meal.totalProtein}g P • {meal.totalCarbs}g C • {meal.totalFat}g F
                      </div>
                    </div>

                    <button
                      onClick={() => deleteMeal(meal.id)}
                      aria-label="Delete meal"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items in meal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {meal.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">{item.foodName}</span>
                        <div className="text-[11px] text-slate-400">
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div className="text-right font-mono font-semibold text-slate-300">
                        {item.calories} kcal
                      </div>
                    </div>
                  ))}
                </div>

                {/* Link to detail */}
                <div className="flex justify-end pt-2">
                  <Link
                    href={`/meals/${meal.id}`}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5"
                  >
                    Deep Breakdown & Macro Analysis <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

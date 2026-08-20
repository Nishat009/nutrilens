'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Camera,
  Sparkles,
  Droplets,
  Plus,
  Flame,
  ArrowRight,
  TrendingUp,
  Clock,
  ChevronRight,
  Utensils,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ProgressRing } from '../../../components/ui/ProgressRing';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { useUserStore } from '../../../lib/stores/user-store';
import { useMealStore } from '../../../lib/stores/meal-store';
import { formatCalories, formatGrams, getTodayDateString } from '../../../lib/utils/format';
import { generateDynamicRecommendations } from '../../../services/recommendations';
import { MEAL_TYPE_CONFIG } from '../../../lib/constants';
import { MealType } from '../../../lib/types';

export default function DashboardPage() {
  const { profile, goal } = useUserStore();
  const { getDailyNutritionForDate, getMealsByDate, waterIntakeMl, addWater } = useMealStore();

  const today = getTodayDateString();
  const todayNutrition = useMemo(() => getDailyNutritionForDate(today), [getDailyNutritionForDate, today, waterIntakeMl]);
  const todayMeals = useMemo(() => getMealsByDate(today), [getMealsByDate, today]);

  const caloriesRemaining = Math.max(0, goal.targetCalories - todayNutrition.totalCalories);
  const caloriePercent = Math.round((todayNutrition.totalCalories / (goal.targetCalories || 1)) * 100);

  const recommendations = useMemo(
    () => generateDynamicRecommendations(profile, goal, todayNutrition),
    [profile, goal, todayNutrition]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Today&apos;s Nutrition Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Calibrated for {profile.name} • {goal.type === 'lose_weight' ? 'Caloric Deficit' : 'High Protein'}
          </p>
        </div>

        <Link href="/scan">
          <Button variant="glow" size="md" leftIcon={<Camera className="w-4 h-4 stroke-[2.5]" />}>
            Scan Meal with AI
          </Button>
        </Link>
      </div>

      {/* Hero Calorie & Macro Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calorie Ring Big Card */}
        <Card variant="glass" className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Calorie Budget
            </span>
            <Badge variant="emerald">{caloriePercent}% of goal</Badge>
          </div>

          <div className="my-2">
            <ProgressRing
              value={todayNutrition.totalCalories}
              max={goal.targetCalories}
              size={210}
              strokeWidth={16}
              color="#10b981"
              trackColor="#1e293b"
            >
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-slate-400">Remaining</span>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {formatCalories(caloriesRemaining)}
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">kcal to target</span>
              </div>
            </ProgressRing>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 pt-4 mt-2 border-t border-slate-800/80 text-left">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Consumed</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {formatCalories(todayNutrition.totalCalories)}{' '}
                <span className="text-xs text-slate-400 font-normal">kcal</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Daily Target</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {formatCalories(goal.targetCalories)}{' '}
                <span className="text-xs text-slate-400 font-normal">kcal</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Macro Split Cards & Hydration */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          {/* 3 Macronutrient Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Protein Card */}
            <Card variant="glass" className="p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Protein
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {Math.round((todayNutrition.totalProtein / (goal.targetProteinG || 1)) * 100)}%
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {formatGrams(todayNutrition.totalProtein)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Target: {goal.targetProteinG}g
                </div>
              </div>
              <ProgressBar
                value={todayNutrition.totalProtein}
                max={goal.targetProteinG}
                variant="purple"
                size="sm"
              />
            </Card>

            {/* Carbs Card */}
            <Card variant="glass" className="p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Carbs
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {Math.round((todayNutrition.totalCarbs / (goal.targetCarbsG || 1)) * 100)}%
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {formatGrams(todayNutrition.totalCarbs)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Target: {goal.targetCarbsG}g
                </div>
              </div>
              <ProgressBar
                value={todayNutrition.totalCarbs}
                max={goal.targetCarbsG}
                variant="amber"
                size="sm"
              />
            </Card>

            {/* Fat Card */}
            <Card variant="glass" className="p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Fats
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {Math.round((todayNutrition.totalFat / (goal.targetFatG || 1)) * 100)}%
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {formatGrams(todayNutrition.totalFat)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Target: {goal.targetFatG}g
                </div>
              </div>
              <ProgressBar
                value={todayNutrition.totalFat}
                max={goal.targetFatG}
                variant="rose"
                size="sm"
              />
            </Card>
          </div>

          {/* Hydration & Fiber Tracker Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hydration Tracker */}
            <Card variant="glass" className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Hydration</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {todayNutrition.waterIntakeMl}{' '}
                    <span className="text-xs text-slate-400 font-normal">/ {goal.targetWaterMl} ml</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => addWater(250)}
                aria-label="Add 250ml water"
                className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> 250ml
              </button>
            </Card>

            {/* Fiber & Micronutrient Card */}
            <Card variant="glass" className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Dietary Fiber</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {formatGrams(todayNutrition.totalFiber)}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {goal.targetFiberG}g goal</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">
                  Optimal gut motility support
                </div>
              </div>
              <Badge variant="emerald">Healthy</Badge>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Scanner Spotlight CTA Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-teal-950/60 border border-emerald-500/30 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> AI Vision Engine Ready
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Planning your next meal? Scan it in seconds.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Snap a picture on your phone or drop an image here. NutriLens automatically identifies food items, portion sizes, and logs macros without manual entry.
            </p>
          </div>

          <Link href="/scan" className="shrink-0">
            <Button variant="glow" size="lg" className="gap-2 px-6 py-3.5 text-slate-950 font-bold">
              <Camera className="w-5 h-5 stroke-[2.5]" /> Launch Camera Scanner
            </Button>
          </Link>
        </div>
      </div>

      {/* 2-Column: Today's Logged Meals & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Meals Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Today&apos;s Meal Log</h3>
            <Link
              href="/meals"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              View Full History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayMeals.length === 0 ? (
            <Card variant="glass" className="p-8 text-center space-y-3">
              <Utensils className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">No meals logged for today yet.</p>
              <Link href="/scan">
                <Button variant="outline" size="sm">Scan Breakfast</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal) => {
                const config = MEAL_TYPE_CONFIG[meal.type as MealType];

                return (
                  <Link key={meal.id} href={`/meals/${meal.id}`}>
                    <Card
                      variant="glass"
                      isHoverable
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {meal.imageUrl ? (
                          <img
                            src={meal.imageUrl}
                            alt={meal.type}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shrink-0 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white capitalize">
                              {config?.label || meal.type}
                            </span>
                            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {meal.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5 max-w-xs">
                            {meal.items.map((i) => i.foodName).join(', ')}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                            <span className="font-semibold text-purple-400">{meal.totalProtein}g P</span>
                            <span className="font-semibold text-amber-400">{meal.totalCarbs}g C</span>
                            <span className="font-semibold text-rose-400">{meal.totalFat}g F</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-black text-white">{meal.totalCalories}</div>
                        <div className="text-[10px] text-emerald-400 font-medium">kcal</div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Recommendations & Insights (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> AI Insights & Coaching
            </h3>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                variant="glass"
                className="p-5 border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {rec.severity === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {rec.severity === 'warning' && <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />}
                    {rec.severity === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
                    <span>{rec.title}</span>
                  </h4>
                  <Badge variant={rec.severity === 'success' ? 'emerald' : rec.severity === 'warning' ? 'blue' : 'slate'} size="sm">
                    {rec.category}
                  </Badge>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{rec.message}</p>

                {rec.actionText && rec.actionUrl && (
                  <Link href={rec.actionUrl} className="inline-block pt-1">
                    <span className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5">
                      {rec.actionText} <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Footprints,
  Activity,
  Award,
  BookOpen,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ProgressRing } from '../../../components/ui/ProgressRing';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { useUserStore } from '../../../lib/stores/user-store';
import { useMealStore } from '../../../lib/stores/meal-store';
import { formatCalories, formatGrams, getTodayDateString } from '../../../lib/utils/format';
import {
  calculateNutritionTargets,
  calculateHydration,
  calculateExerciseAndNeat,
  calculate30DayWeightProjection,
} from '../../../services/nutrition';
import { MEAL_TYPE_CONFIG } from '../../../lib/constants';
import { MealType } from '../../../lib/types';
import { MOCK_DIETS } from '../../../data/mock/diets';

export default function DashboardPage() {
  const { profile, goal, fetchUserProfile } = useUserStore();
  const { getDailyNutritionForDate, getMealsByDate, waterIntakeMl, addWater, fetchMeals } = useMealStore();

  const [activeTab, setActiveTab] = useState<'workout' | 'neat'>('neat');

  const today = getTodayDateString();

  useEffect(() => {
    fetchUserProfile();
    fetchMeals(today);
  }, [fetchUserProfile, fetchMeals, today]);

  const todayNutrition = useMemo(
    () => getDailyNutritionForDate(today),
    [getDailyNutritionForDate, today, waterIntakeMl]
  );
  const todayMeals = useMemo(() => getMealsByDate(today), [getMealsByDate, today]);

  const targets = useMemo(
    () => calculateNutritionTargets(profile, goal.type),
    [profile, goal.type]
  );

  const hydration = useMemo(
    () => calculateHydration(profile.weightKg, profile.heightCm, profile.activityLevel),
    [profile.weightKg, profile.heightCm, profile.activityLevel]
  );

  const exercise = useMemo(
    () => calculateExerciseAndNeat(goal.type, profile.activityLevel),
    [goal.type, profile.activityLevel]
  );

  const projection = useMemo(
    () =>
      calculate30DayWeightProjection(
        profile.weightKg,
        targets.tdee,
        goal.targetCalories,
        todayNutrition.totalCalories
      ),
    [profile.weightKg, targets.tdee, goal.targetCalories, todayNutrition.totalCalories]
  );

  const caloriesRemaining = Math.max(0, goal.targetCalories - todayNutrition.totalCalories);
  const caloriePercent = Math.round(
    (todayNutrition.totalCalories / (goal.targetCalories || 1)) * 100
  );

  // Active diet plan
  const activeDietName = profile.dietaryPreferences?.[0] || 'Mediterranean Wellness';
  const activeDiet = useMemo(
    () => MOCK_DIETS.find((d) => d.name === activeDietName || d.slug === activeDietName) || MOCK_DIETS[0],
    [activeDietName]
  );

  const waterGlassesDrank = Math.round(todayNutrition.waterIntakeMl / 250);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Clinical Nutrition Dashboard
            </h1>
            <Badge variant="emerald" size="sm">
              AI Nutritionist Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Calibrated for <strong className="text-white">{profile.name}</strong> • Diet Protocol:{' '}
            <strong className="text-emerald-400">{activeDiet.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/diets">
            <Button variant="outline" size="md" leftIcon={<BookOpen className="w-4 h-4" />}>
              Diet Protocols
            </Button>
          </Link>
          <Link href="/scan">
            <Button variant="glow" size="md" leftIcon={<Camera className="w-4 h-4 stroke-[2.5]" />}>
              Scan Food / Vegetable
            </Button>
          </Link>
        </div>
      </div>

      {/* 30-Day Estimated Energy-Balance Change Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-teal-950/70 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <TrendingUp className="w-3.5 h-3.5" /> Estimated Energy-Balance Change (30 Days)
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {projection.projected30DayChangeKg < 0 ? (
                <span>
                  Estimated Fat Balance Pace:{' '}
                  <span className="text-emerald-400">
                    {Math.abs(projection.projected30DayChangeKg)} kg
                  </span>{' '}
                  over 30 days
                </span>
              ) : (
                <span>
                  Projected Weight Pace: <span className="text-teal-400">{projection.projectedWeightIn30DaysKg} kg</span>
                </span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {projection.statusAdvice} Daily TDEE Expenditure: <strong>{targets.tdee} kcal</strong> • Current Deficit Pace: <strong>{Math.abs(projection.dailyDeficit)} kcal/day</strong>.
            </p>
            <p className="text-[11px] text-slate-400/90 italic pt-0.5">
              *Theoretical energy-balance estimate. Actual biological weight change varies with fluid balance, glycogen, and metabolic adaptation.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">30-Day Estimated Weight</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {projection.projectedWeightIn30DaysKg}{' '}
                <span className="text-xs text-slate-400 font-normal">kg</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Current: {profile.weightKg} kg</div>
            </div>
          </div>
        </div>
      </div>


      {/* Hero Calorie & Macro Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calorie Ring Big Card */}
        <Card
          variant="glass"
          className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Daily Calorie Budget
            </span>
            <Badge variant={caloriePercent > 100 ? 'rose' : 'emerald'}>
              {caloriePercent}% of goal
            </Badge>
          </div>

          <div className="my-2">
            <ProgressRing
              value={todayNutrition.totalCalories}
              max={goal.targetCalories}
              size={210}
              strokeWidth={16}
              color={caloriePercent > 100 ? '#f43f5e' : '#10b981'}
              trackColor="#1e293b"
            >
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-slate-400">
                  {todayNutrition.totalCalories > goal.targetCalories ? 'Surplus' : 'Remaining'}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {todayNutrition.totalCalories > goal.targetCalories
                    ? `+${formatCalories(todayNutrition.totalCalories - goal.targetCalories)}`
                    : formatCalories(caloriesRemaining)}
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">kcal to target</span>
              </div>
            </ProgressRing>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 pt-4 mt-2 border-t border-slate-800/80 text-left">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Consumed Today</div>
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

          {/* Hydration Tracker Card */}
          <Card variant="glass" className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">
                    Daily Hydration Prescription ({profile.weightKg}kg / {profile.heightCm}cm)
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {todayNutrition.waterIntakeMl}{' '}
                    <span className="text-xs text-slate-400 font-normal">
                      / {hydration.targetMl} ml ({hydration.targetLiters}L • {hydration.glassesCount} Glasses)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addWater(250)}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> +1 Glass (250ml)
                </button>
                <button
                  onClick={() => addWater(500)}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> +1 Bottle (500ml)
                </button>
              </div>
            </div>

            <ProgressBar
              value={todayNutrition.waterIntakeMl}
              max={hydration.targetMl}
              variant="cyan"
              size="sm"
            />
            <p className="text-[11px] text-slate-400">{hydration.guidanceText}</p>
          </Card>
        </div>
      </div>

      {/* Activity & NEAT Alternatives + Active Diet Superfoods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exercise & NEAT Non-Exercise Activity Prescription (6 cols) */}
        <Card variant="glass" className="lg:col-span-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Daily Physical Activity & NEAT</h3>
            </div>

            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('neat')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'neat'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                No-Gym NEAT
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('workout')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'workout'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gym Workout
              </button>
            </div>
          </div>

          {activeTab === 'neat' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Don&apos;t have time for the gym today? Burn <strong>300-500 kcal</strong> effortlessly using these NEAT habits:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exercise.neatAlternatives.map((neat) => (
                  <div
                    key={neat.title}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                        {neat.title}
                      </div>
                      <Badge variant="emerald" size="sm">
                        {neat.caloriesBurned}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{neat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Prescription</span>
                <Badge variant="purple">{exercise.recommendedDailyMinutes} Mins / Day</Badge>
              </div>
              <div className="text-sm font-bold text-white">{exercise.primaryWorkoutType}</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prioritize compound movements (squats, deadlifts, push-ups) to elevate post-exercise oxygen consumption (EPOC) and protect lean muscle mass.
              </p>
            </div>
          )}
        </Card>

        {/* Right: Active Diet Protocol & Recommended Superfoods (6 cols) */}
        <Card variant="glass" className="lg:col-span-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Active Protocol: {activeDiet.name}
              </h3>
            </div>
            <Link
              href="/diets"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Explore All Diets <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{activeDiet.tagline}</p>

          {/* Macro Ratio Target Bar */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold font-mono">
              <span className="text-purple-400">{activeDiet.macroRatio.protein}% Protein</span>
              <span className="text-amber-400">{activeDiet.macroRatio.carbs}% Carbs</span>
              <span className="text-rose-400">{activeDiet.macroRatio.fat}% Fat</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-slate-800">
              <div className="bg-purple-500" style={{ width: `${activeDiet.macroRatio.protein}%` }} />
              <div className="bg-amber-500" style={{ width: `${activeDiet.macroRatio.carbs}%` }} />
              <div className="bg-rose-500" style={{ width: `${activeDiet.macroRatio.fat}%` }} />
            </div>
          </div>

          {/* Allowed Foods */}
          <div>
            <div className="text-xs uppercase font-bold text-emerald-400 mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Foundation Foods:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeDiet.allowedFoods.slice(0, 6).map((food) => (
                <span
                  key={food}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium"
                >
                  ✓ {food}
                </span>
              ))}
            </div>
          </div>

          {/* Foods to Avoid Warning */}
          {activeDiet.foodsToLimit && activeDiet.foodsToLimit.length > 0 && (
            <div>
              <div className="text-xs uppercase font-bold text-rose-400 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Foods to Avoid / Limit:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeDiet.foodsToLimit.slice(0, 4).map((food) => (
                  <span
                    key={food}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-medium"
                  >
                    ✕ {food}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Today's Logged Meals Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Today&apos;s Meals</h3>
          <Link
            href="/meals"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            Full Meal History <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayMeals.length === 0 ? (
          <Card variant="glass" className="p-8 sm:p-12 text-center space-y-4 border-dashed border-slate-800">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Utensils className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-base font-bold text-white">No meals logged for today yet</h4>
              <p className="text-xs text-slate-400">
                Your dashboard is ready! Take a quick photo of your breakfast, lunch, or raw vegetable to start tracking your macros in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/scan">
                <Button variant="glow" size="sm" leftIcon={<Camera className="w-4 h-4" />}>
                  Scan Meal / Vegetable
                </Button>
              </Link>
              <Link href="/diets">
                <Button variant="outline" size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
                  Explore Diet Plans
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PersonalizedDietPlan,
  PersonalizedMealItem,
  PersonalizedMealSlot,
  UserProfile,
  DietMatchScore,
} from '../../lib/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FoodSwapModal } from './FoodSwapModal';
import { AdaptivePlanModal } from './AdaptivePlanModal';
import { useUserStore } from '../../lib/stores/user-store';
import { plannerApi, dietApi } from '../../services/api-client';
import {
  Sparkles,
  Flame,
  Scale,
  Droplets,
  HeartPulse,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Clock,
  Utensils,
  ChevronRight,
  ShieldCheck,
  Award,
  Info,
  Sliders,
  Check,
} from 'lucide-react';

interface PersonalizedDietPlanViewProps {
  plan: PersonalizedDietPlan;
  onPlanUpdate?: (updatedPlan: PersonalizedDietPlan) => void;
  onRetakeAssessment?: () => void;
}

export function PersonalizedDietPlanView({
  plan,
  onPlanUpdate,
  onRetakeAssessment,
}: PersonalizedDietPlanViewProps) {
  const router = useRouter();
  const { profile, updateGoal, updateProfile } = useUserStore();

  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);
  const [currentPlan, setCurrentPlan] = useState<PersonalizedDietPlan>(plan);
  const [swapTarget, setSwapTarget] = useState<{
    dayNumber: number;
    mealType: string;
    item: PersonalizedMealItem;
  } | null>(null);
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const activeDay =
    currentPlan.sevenDayPlan.find((d) => d.dayNumber === activeDayNumber) ||
    currentPlan.sevenDayPlan[0];

  // Handle Food Swap Confirmation
  const handleSwapConfirm = (newItem: PersonalizedMealItem) => {
    if (!swapTarget) return;
    const { dayNumber, mealType, item } = swapTarget;

    const updated7Days = currentPlan.sevenDayPlan.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      const updatedMeals = d.meals.map((slot) => {
        if (slot.mealType !== mealType) return slot;
        const updatedItems = slot.items.map((it) => (it.id === item.id ? newItem : it));

        let slotCal = 0;
        let slotP = 0;
        let slotC = 0;
        let slotF = 0;
        let slotFib = 0;
        updatedItems.forEach((it) => {
          slotCal += it.calories;
          slotP += it.protein;
          slotC += it.carbs;
          slotF += it.fat;
          slotFib += it.fiber;
        });

        return {
          ...slot,
          items: updatedItems,
          slotCalories: slotCal,
          slotProtein: Math.round(slotP * 10) / 10,
          slotCarbs: Math.round(slotC * 10) / 10,
          slotFat: Math.round(slotF * 10) / 10,
          slotFiber: Math.round(slotFib * 10) / 10,
        };
      });

      let dayCal = 0;
      let dayP = 0;
      let dayC = 0;
      let dayF = 0;
      let dayFib = 0;
      updatedMeals.forEach((s) => {
        dayCal += s.slotCalories;
        dayP += s.slotProtein;
        dayC += s.slotCarbs;
        dayF += s.slotFat;
        dayFib += s.slotFiber;
      });

      return {
        ...d,
        meals: updatedMeals,
        dayCalories: dayCal,
        dayProtein: Math.round(dayP),
        dayCarbs: Math.round(dayC),
        dayFat: Math.round(dayF),
        dayFiber: Math.round(dayFib),
      };
    });

    const updatedPlan: PersonalizedDietPlan = {
      ...currentPlan,
      sevenDayPlan: updated7Days,
    };
    setCurrentPlan(updatedPlan);
    if (onPlanUpdate) onPlanUpdate(updatedPlan);
  };

  // Sync this personalized plan to user's weekly planner & goals
  const handleAdoptAndSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Update user nutrition goals
      await updateGoal({
        targetCalories: currentPlan.summary.targetCalories,
        targetProteinG: currentPlan.summary.targetProteinG,
        targetCarbsG: currentPlan.summary.targetCarbsG,
        targetFatG: currentPlan.summary.targetFatG,
        targetFiberG: currentPlan.summary.targetFiberG,
        targetWaterMl: currentPlan.summary.targetWaterMl,
      });

      // 2. Save active diet preference
      await updateProfile({
        dietaryPreferences: [currentPlan.selectedDiet.name],
      });

      // 3. Adopt diet on server
      await dietApi.adoptDiet(currentPlan.selectedDiet.name);

      // 4. Populate weekly planned meals for each day (0=Sun, 1=Mon, ...)
      for (const day of currentPlan.sevenDayPlan) {
        const dayOfWeekIndex = (day.dayNumber % 7); // 1->Mon (1), ... 7->Sun (0)
        for (const slot of day.meals) {
          const combinedFoodName = slot.items.map((i) => i.name).join(' + ');
          try {
            await plannerApi.addPlannedMeal({
              dayOfWeek: dayOfWeekIndex,
              mealType: slot.mealType === 'morning_snack' || slot.mealType === 'afternoon_snack' ? 'snack' : slot.mealType as any,
              foodName: combinedFoodName.slice(0, 100),
              calories: slot.slotCalories,
              protein: slot.slotProtein,
              carbs: slot.slotCarbs,
              fat: slot.slotFat,
            });
          } catch {
            // Ignore single slot duplicate errors
          }
        }
      }

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to sync personalized plan:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Plan Summary */}
      <Card variant="glass" className="p-6 border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Tailored For You
              </span>
              <Badge variant="emerald">{currentPlan.selectedDiet.name}</Badge>
              <Badge variant="outline">{currentPlan.summary.paceLabel}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Your Personalized Diet Plan
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Calibrated to your biometrics, health considerations, and everyday Bangladeshi food staples with portion-controlled guidelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetakeAssessment || (() => router.push('/onboarding'))}
              className="flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" /> Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdaptiveModalOpen(true)}
              className="flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Activity className="w-3.5 h-3.5" /> 2–3 Week Check-In
            </Button>
            <Button
              variant="glow"
              size="sm"
              onClick={handleAdoptAndSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              {syncSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Plan Synchronized!
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" /> {isSyncing ? 'Syncing...' : 'Adopt to Weekly Planner'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Nutritional Targets Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Daily Calories
            </div>
            <div className="text-lg font-black text-amber-400 mt-1">
              {currentPlan.summary.targetCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">TDEE: {currentPlan.summary.tdee} kcal</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> Protein Target
            </div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {currentPlan.summary.targetProteinG} <span className="text-xs font-normal text-slate-400">g</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">~{currentPlan.selectedDiet.macroRatio.protein}% of calories</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-400" /> Carbs Target
            </div>
            <div className="text-lg font-black text-blue-400 mt-1">
              {currentPlan.summary.targetCarbsG} <span className="text-xs font-normal text-slate-400">g</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">~{currentPlan.selectedDiet.macroRatio.carbs}% (Slow GI)</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" /> Healthy Fats
            </div>
            <div className="text-lg font-black text-purple-400 mt-1">
              {currentPlan.summary.targetFatG} <span className="text-xs font-normal text-slate-400">g</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">~{currentPlan.selectedDiet.macroRatio.fat}% of calories</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-teal-400" /> Dietary Fiber
            </div>
            <div className="text-lg font-black text-teal-400 mt-1">
              {currentPlan.summary.targetFiberG}+ <span className="text-xs font-normal text-slate-400">g</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">High prebiotic fiber</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Daily Water
            </div>
            <div className="text-lg font-black text-cyan-400 mt-1">
              {(currentPlan.summary.targetWaterMl / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">~{Math.round(currentPlan.summary.targetWaterMl / 250)} glasses</div>
          </div>
        </div>
      </Card>

      {/* Safety & Medical Advisory Alert (if flagged) */}
      {currentPlan.safetyAlerts.requiresDoctorConsult && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="font-bold text-amber-300">Healthcare Professional Consultation Advisory</div>
            <p className="text-slate-300 leading-relaxed">
              Based on your selected physical profile or health conditions, please discuss this dietary schedule with your physician or registered dietitian. This application is an educational wellness tool and not intended for medical diagnoses or drug dosing.
            </p>
            {currentPlan.safetyAlerts.messages.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-200/90 pt-1">
                {currentPlan.safetyAlerts.messages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Ranked Protocol Matching Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" /> Why This Plan Was Chosen
          </h2>
          <span className="text-xs text-slate-400">Multi-Factor Clinical Algorithm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentPlan.topMatches.slice(0, 3).map((match, idx) => {
            const isTop = idx === 0;
            return (
              <Card
                key={match.slug}
                variant="glass"
                className={`p-4 border ${
                  isTop
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800'
                } space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant={isTop ? 'emerald' : 'outline'} size="sm">
                    {match.tier} ({match.score}%)
                  </Badge>
                  <div className="text-xs text-slate-500">
                    P:{match.macroRatio.protein}% C:{match.macroRatio.carbs}% F:{match.macroRatio.fat}%
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">{match.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{match.tagline}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isTop ? 'Matching Highlights' : 'Why Ranked Lower'}
                  </div>
                  {(isTop ? match.reasons : match.cautionReasons.length > 0 ? match.cautionReasons : match.reasons)
                    .slice(0, 2)
                    .map((r, rIdx) => (
                      <div key={rIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            isTop ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        />
                        <span>{r}</span>
                      </div>
                    ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 7-Day Meal Plan Interactive Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" /> 7-Day Personalized Meal Plan
            </h2>
            <p className="text-xs text-slate-400">
              Select a day below to view meal slots, practical household measurements, and swap options.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <RefreshCw className="w-3.5 h-3.5" /> Click &quot;Swap&quot; to change any dish
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {currentPlan.sevenDayPlan.map((d) => {
            const isActive = d.dayNumber === activeDayNumber;
            return (
              <button
                key={d.dayNumber}
                type="button"
                onClick={() => setActiveDayNumber(d.dayNumber)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>Day {d.dayNumber}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-800 text-slate-400'
                }`}>
                  {d.dayCalories} kcal
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Day Detail Card */}
        <Card variant="glass" className="p-6 border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {activeDay.dayName}
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">{activeDay.focusTitle}</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-amber-400 font-bold">{activeDay.dayCalories} kcal</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">P: {activeDay.dayProtein}g</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400">C: {activeDay.dayCarbs}g</span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400">F: {activeDay.dayFat}g</span>
            </div>
          </div>

          {/* Meal Slots List */}
          <div className="space-y-4">
            {activeDay.meals.map((slot) => (
              <div
                key={slot.mealType}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{slot.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> {slot.time}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-400">{slot.slotCalories} kcal</div>
                    <div className="text-[11px] text-slate-400">
                      P: {slot.slotProtein}g | C: {slot.slotCarbs}g | F: {slot.slotFat}g
                    </div>
                  </div>
                </div>

                {/* Items in this slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {slot.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-2 group hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-xs text-white leading-tight">
                          {item.name}
                        </div>
                        {item.bengaliName && (
                          <div className="text-[11px] text-emerald-400/90 mt-0.5">
                            {item.bengaliName}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">
                          Portion: <span className="text-slate-300">{item.portion}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <div className="text-[10px] text-slate-400">
                          <span className="font-bold text-amber-400">{item.calories}</span> kcal
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSwapTarget({
                              dayNumber: activeDay.dayNumber,
                              mealType: slot.mealType,
                              item,
                            })
                          }
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                        >
                          <RefreshCw className="w-3 h-3" /> Swap
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bangladeshi Behavioral Guidelines Card */}
      <Card variant="glass" className="p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Bangladeshi Healthy Eating Guidelines</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentPlan.behavioralTips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Modals */}
      {swapTarget && (
        <FoodSwapModal
          isOpen={Boolean(swapTarget)}
          onClose={() => setSwapTarget(null)}
          currentItem={swapTarget.item}
          userAllergies={profile.allergies}
          onSwapConfirm={handleSwapConfirm}
        />
      )}

      <AdaptivePlanModal
        isOpen={isAdaptiveModalOpen}
        onClose={() => setIsAdaptiveModalOpen(false)}
        startingWeightKg={currentPlan.summary.currentWeightKg}
      />
    </div>
  );
}

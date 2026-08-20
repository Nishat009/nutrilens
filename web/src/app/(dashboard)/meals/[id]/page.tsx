'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Utensils,
  Sparkles,
  PieChart as PieChartIcon,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useMealStore } from '../../../../lib/stores/meal-store';
import { formatCalories, formatGrams, formatDatePretty } from '../../../../lib/utils/format';
import { MEAL_TYPE_CONFIG } from '../../../../lib/constants';
import { MealType } from '../../../../lib/types';

export default function MealDetailPage() {
  const params = useParams();
  const mealId = params.id as string;
  const { getMealById } = useMealStore();

  const meal = getMealById(mealId);

  if (!meal) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-white">Meal not found</h2>
        <p className="text-xs text-slate-400">This meal may have been deleted or does not exist.</p>
        <Link href="/meals">
          <Button variant="primary">Back to Meal Log</Button>
        </Link>
      </div>
    );
  }

  const config = MEAL_TYPE_CONFIG[meal.type as MealType];
  const proteinCal = meal.totalProtein * 4;
  const carbsCal = meal.totalCarbs * 4;
  const fatCal = meal.totalFat * 9;
  const totalMacroCal = proteinCal + carbsCal + fatCal || 1;

  const proteinPct = Math.round((proteinCal / totalMacroCal) * 100);
  const carbsPct = Math.round((carbsCal / totalMacroCal) * 100);
  const fatPct = Math.round((fatCal / totalMacroCal) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Back Nav */}
      <div className="flex items-center justify-between">
        <Link href="/meals">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Meals
          </Button>
        </Link>
        <Badge variant="emerald" className="capitalize">
          {config?.label || meal.type}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Col: Photo & Macro Breakdown Chart */}
        <div className="md:col-span-5 space-y-6">
          <Card variant="glass" className="p-4 overflow-hidden border-slate-800">
            {meal.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800">
                <img src={meal.imageUrl} alt={meal.type} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900 aspect-[4/3] flex items-center justify-center text-slate-500 border border-slate-800">
                <Utensils className="w-12 h-12" />
              </div>
            )}

            <div className="pt-4 space-y-4">
              <div className="text-center">
                <div className="text-3xl font-black text-white">{formatCalories(meal.totalCalories)}</div>
                <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Total Calories (kcal)
                </div>
              </div>

              {/* Macro Ratios Visual Bar */}
              <div className="space-y-2">
                <div className="h-3 rounded-full overflow-hidden flex bg-slate-800">
                  <div className="bg-purple-500 transition-all" style={{ width: `${proteinPct}%` }} />
                  <div className="bg-amber-500 transition-all" style={{ width: `${carbsPct}%` }} />
                  <div className="bg-rose-500 transition-all" style={{ width: `${fatPct}%` }} />
                </div>
                <div className="flex justify-between text-[11px] font-mono font-semibold pt-1">
                  <span className="text-purple-400">{proteinPct}% Protein</span>
                  <span className="text-amber-400">{carbsPct}% Carbs</span>
                  <span className="text-rose-400">{fatPct}% Fat</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatDatePretty(meal.date)}</span>
                  <span className="text-slate-500">•</span>
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{meal.time}</span>
                </div>
                {meal.notes && <p className="text-slate-400 pt-1 italic">&ldquo;{meal.notes}&rdquo;</p>}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Itemized Ingredient Records */}
        <div className="md:col-span-7 space-y-6">
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Itemized Nutritional Breakdown</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified USDA ingredient weights and micro/macro contributions
              </p>
            </div>

            <div className="space-y-3">
              {meal.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{item.foodName}</span>
                    <span className="font-mono font-bold text-xs text-emerald-400">
                      {item.calories} kcal
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Portion: {item.quantity} {item.unit}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-purple-400">{item.protein}g P</span>
                      <span className="text-amber-400">{item.carbs}g C</span>
                      <span className="text-rose-400">{item.fat}g F</span>
                      {item.fiber > 0 && <span className="text-cyan-400">{item.fiber}g Fib</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                This meal contributed {formatGrams(meal.totalProtein)} toward your daily muscle synthesis target.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

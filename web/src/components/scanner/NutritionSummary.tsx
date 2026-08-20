'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { formatCalories, formatGrams } from '../../lib/utils/format';

interface NutritionSummaryProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  className?: string;
}

export function NutritionSummary({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  totalFiber,
  className = '',
}: NutritionSummaryProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Total Energy Display */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Estimated Nutrition
          </span>
          <h3 className="text-sm font-semibold text-slate-300 mt-0.5">Total Meal Energy</h3>
        </div>
        <div className="text-right">
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {formatCalories(totalCalories)}
          </span>
          <span className="text-xs text-emerald-400 font-bold ml-1.5">kcal</span>
        </div>
      </div>

      {/* 4 Macro Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Protein */}
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
          <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
            Protein
          </div>
          <div className="text-lg font-black text-white mt-0.5">
            {formatGrams(totalProtein)}
          </div>
          <div className="text-[10px] text-purple-400/80 font-mono mt-0.5">
            {Math.round(totalProtein * 4)} kcal
          </div>
        </div>

        {/* Carbs */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            Carbs
          </div>
          <div className="text-lg font-black text-white mt-0.5">
            {formatGrams(totalCarbs)}
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
            {Math.round(totalCarbs * 4)} kcal
          </div>
        </div>

        {/* Fat */}
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
          <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Fat</div>
          <div className="text-lg font-black text-white mt-0.5">
            {formatGrams(totalFat)}
          </div>
          <div className="text-[10px] text-rose-400/80 font-mono mt-0.5">
            {Math.round(totalFat * 9)} kcal
          </div>
        </div>

        {/* Fiber */}
        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center">
          <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
            Fiber
          </div>
          <div className="text-lg font-black text-white mt-0.5">
            {formatGrams(totalFiber)}
          </div>
          <div className="text-[10px] text-teal-400/80 font-medium mt-0.5">Gut Support</div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { PortionSelector } from './PortionSelector';
import { FoodSearch } from './FoodSearch';
import { DatabaseFoodItem } from '../../data/nutrition-database';
import { NutritionResultItem } from '../../services/nutrition-engine';
import { Badge } from '../ui/Badge';

interface DetectedFoodItemProps {
  item: NutritionResultItem;
  onUpdatePortion: (id: string, newQuantity: number) => void;
  onReplaceFood: (id: string, newFood: DatabaseFoodItem) => void;
  onRemove: (id: string) => void;
}

export function DetectedFoodItem({
  item,
  onUpdatePortion,
  onReplaceFood,
  onRemove,
}: DetectedFoodItemProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getConfidenceBadge = () => {
    if (item.confidenceLevel === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
          <CheckCircle className="w-3 h-3 text-emerald-400" /> {Math.round(item.confidence * 100)}% Match
        </span>
      );
    }
    if (item.confidenceLevel === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-semibold">
          <HelpCircle className="w-3 h-3 text-amber-400" /> {Math.round(item.confidence * 100)}% Possible
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-semibold">
        <AlertTriangle className="w-3 h-3 text-rose-400" /> Low Confidence
      </span>
    );
  };

  return (
    <>
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
        {/* Item Header: Name, Confidence, Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            )}
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-400">{item.category}</span>
                <span>•</span>
                {getConfidenceBadge()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-emerald-300 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Change
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="Remove item"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Low or Medium Confidence Helper Banner */}
        {item.confidenceLevel !== 'high' && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Not quite right? Tap &ldquo;Change&rdquo; or choose an alternative:</span>
            </div>
            {item.suggestions && item.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {item.suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-amber-500/30 text-[10px] text-slate-200 hover:text-amber-300 hover:border-amber-400 transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Portion Controls & Live Macro Breakdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Adjust Portion Size
            </span>
            <PortionSelector
              quantity={item.quantity}
              unit={item.unit}
              onChange={(newQty) => onUpdatePortion(item.id, newQty)}
            />
          </div>

          <div className="flex items-center gap-3 font-mono text-xs sm:text-right">
            <div className="text-right">
              <div className="font-bold text-white text-sm">{item.calories} kcal</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="text-purple-400">{item.protein}g P</span>
                <span className="text-amber-400">{item.carbs}g C</span>
                <span className="text-rose-400">{item.fat}g F</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Food Search / Replace Modal */}
      <FoodSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectFood={(newFood) => onReplaceFood(item.id, newFood)}
        title={`Change "${item.name}"`}
      />
    </>
  );
}

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

  const [isConfirmed, setIsConfirmed] = useState(false);

  const getConfidenceBadge = () => {
    if (item.confidenceLevel === 'high' || isConfirmed) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
          <CheckCircle className="w-3 h-3 text-emerald-400" /> {isConfirmed ? '100% Confirmed' : `${Math.round(item.confidence * 100)}% Match`}
        </span>
      );
    }
    if (item.confidenceLevel === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-semibold">
          <HelpCircle className="w-3 h-3 text-amber-400" /> {Math.round(item.confidence * 100)}% Match
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-semibold">
        <AlertTriangle className="w-3 h-3 text-rose-400" /> Low Confidence
      </span>
    );
  };

  const [showVisualDetails, setShowVisualDetails] = useState(false);

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
                className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0 shadow-sm"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                {item.isVegetableMatch && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                    USDA 100g Raw
                  </span>
                )}
                {item.caloriesPerPiece && item.pieceWeightGrams && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold shrink-0">
                    {item.caloriesPerPiece} kcal / piece (~{item.pieceWeightGrams}g)
                  </span>
                )}
              </div>
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

        {/* Visual Botanical Description & Image Match Profile */}
        {item.visualDescription && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Visual Profile & Botanical Match</span>
              </div>
              {item.pieceUnitLabel && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Standard: {item.pieceUnitLabel}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {item.visualDescription}
            </p>
            {item.visualMatchExplanation && (
              <div className="text-[10px] text-emerald-400/90 font-mono bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/30">
                {item.visualMatchExplanation}
              </div>
            )}
          </div>
        )}

        {/* Medium Confidence Confirmation Prompt */}
        {!isConfirmed && item.confidenceLevel === 'medium' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>We think this might be: <strong className="text-white">{item.name}</strong> ({Math.round(item.confidence * 100)}%). Is this correct?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsConfirmed(true)}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Yes
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Choose another
              </button>
            </div>
          </div>
        )}

        {/* Low Confidence Manual Search Callout */}
        {item.confidenceLevel === 'low' && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>We couldn&apos;t confidently identify this food. Search our verified database:</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Search Database
            </button>
          </div>
        )}

        {/* Portion Controls & Live Macro Breakdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Adjust Portion Size
            </span>
            <PortionSelector
              quantity={item.quantity}
              unit={item.unit}
              pieceWeightGrams={item.pieceWeightGrams}
              caloriesPerPiece={item.caloriesPerPiece}
              pieceUnitLabel={item.pieceUnitLabel}
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

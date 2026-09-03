'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FoodSwapOption, PersonalizedMealItem } from '../../lib/types';
import { getFoodSwaps } from '../../services/diet-recommender';
import { RefreshCw, CheckCircle2, ArrowRight, Flame, Scale, Sparkles } from 'lucide-react';

interface FoodSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: PersonalizedMealItem | null;
  userAllergies?: string[];
  onSwapConfirm: (newItem: PersonalizedMealItem) => void;
}

export function FoodSwapModal({
  isOpen,
  onClose,
  currentItem,
  userAllergies = [],
  onSwapConfirm,
}: FoodSwapModalProps) {
  const [swaps, setSwaps] = useState<FoodSwapOption[]>([]);
  const [selectedSwap, setSelectedSwap] = useState<FoodSwapOption | null>(null);

  useEffect(() => {
    if (currentItem && isOpen) {
      const alternatives = getFoodSwaps(currentItem.foodId, userAllergies);
      setSwaps(alternatives);
      setSelectedSwap(alternatives[0] || null);
    }
  }, [currentItem, isOpen, userAllergies]);

  if (!currentItem) return null;

  const handleApplySwap = () => {
    if (!selectedSwap) return;
    const replacement: PersonalizedMealItem = {
      ...currentItem,
      foodId: selectedSwap.foodId,
      name: selectedSwap.name,
      bengaliName: selectedSwap.bengaliName,
      portion: selectedSwap.portion,
      grams: selectedSwap.grams,
      calories: selectedSwap.calories,
      protein: selectedSwap.protein,
      carbs: selectedSwap.carbs,
      fat: selectedSwap.fat,
      fiber: selectedSwap.fiber,
    };
    onSwapConfirm(replacement);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Swap Food Item" maxWidth="600px">
      <div className="space-y-6 text-slate-100">
        {/* Current Food Header */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" /> Current Meal Item
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-base">{currentItem.name}</div>
              {currentItem.bengaliName && (
                <div className="text-xs text-emerald-400">{currentItem.bengaliName}</div>
              )}
              <div className="text-xs text-slate-400 mt-0.5">Portion: {currentItem.portion}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-amber-400">{currentItem.calories} kcal</div>
              <div className="text-xs text-slate-400">
                P: {currentItem.protein}g | C: {currentItem.carbs}g | F: {currentItem.fat}g
              </div>
            </div>
          </div>
        </div>

        {/* Swap Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Compatible Alternatives
            </label>
            <span className="text-xs text-slate-500">Allergy-safe & macro-aligned</span>
          </div>

          {swaps.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
              No direct swap alternatives found for this item with your current allergy settings.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {swaps.map((option) => {
                const isSelected = selectedSwap?.foodId === option.foodId;
                return (
                  <div
                    key={option.foodId}
                    onClick={() => setSelectedSwap(option)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{option.name}</span>
                        {isSelected && (
                          <Badge variant="emerald" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Selected
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-emerald-400/90">{option.bengaliName}</div>
                      <div className="text-xs text-slate-400">
                        {option.portion} • <span className="text-slate-500">{option.reason}</span>
                      </div>
                    </div>

                    <div className="text-right pl-3 shrink-0">
                      <div className="text-sm font-bold text-amber-400">{option.calories} kcal</div>
                      <div className="text-[11px] text-slate-400">
                        P: {option.protein}g | C: {option.carbs}g | F: {option.fat}g
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="glow"
            disabled={!selectedSwap || swaps.length === 0}
            onClick={handleApplySwap}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Swap into Meal Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

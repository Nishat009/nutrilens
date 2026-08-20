'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, Calendar, Utensils } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MealType } from '../../lib/types';
import { MEAL_TYPE_CONFIG } from '../../lib/constants';
import { getTodayDateString } from '../../lib/utils/format';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mealType: MealType, date: string, time: string, notes: string) => Promise<void>;
  defaultMealType?: MealType;
  totalCalories: number;
}

export function AddMealModal({
  isOpen,
  onClose,
  onConfirm,
  defaultMealType = 'lunch',
  totalCalories,
}: AddMealModalProps) {
  const [selectedType, setSelectedType] = useState<MealType>(defaultMealType);
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(selectedType, date, time, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Today's Meals" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Meal Type Selection Grid */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Select Meal Slot
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
              const cfg = MEAL_TYPE_CONFIG[type];
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs capitalize transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date and Time Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Optional Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Meal Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Pre-workout lunch with extra protein"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="glow"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
          >
            Log {totalCalories} kcal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

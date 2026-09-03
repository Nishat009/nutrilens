'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { AdaptivePlanReview } from '../../lib/types';
import { reviewAdaptiveProgress } from '../../services/diet-recommender';
import {
  Activity,
  TrendingDown,
  TrendingUp,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Flame,
} from 'lucide-react';

interface AdaptivePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  startingWeightKg: number;
  onApplyAdjustment?: (adjustedCalories: number) => void;
}

export function AdaptivePlanModal({
  isOpen,
  onClose,
  startingWeightKg,
  onApplyAdjustment,
}: AdaptivePlanModalProps) {
  const [currentWeight, setCurrentWeight] = useState<string>(startingWeightKg.toString());
  const [weeksElapsed, setWeeksElapsed] = useState<number>(3);
  const [hungerRating, setHungerRating] = useState<number>(3); // 1 = low, 5 = high
  const [energyRating, setEnergyRating] = useState<number>(3); // 1 = low, 5 = high
  const [adherenceRating, setAdherenceRating] = useState<number>(4); // 1 = low, 5 = high

  const [reviewResult, setReviewResult] = useState<AdaptivePlanReview | null>(null);

  const handleRunReview = () => {
    const curWt = parseFloat(currentWeight) || startingWeightKg;
    const result = reviewAdaptiveProgress({
      startingWeightKg,
      currentWeightKg: curWt,
      weeksElapsed,
      hungerRating,
      energyRating,
      adherenceRating,
    });
    setReviewResult(result);
  };

  const handleReset = () => {
    setReviewResult(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="2–3 Week Adaptive Plan Check-In" maxWidth="620px">
      <div className="space-y-6 text-slate-100">
        {!reviewResult ? (
          <div className="space-y-5">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                Diets should evolve with your body. Check in after 2–3 weeks to see if your portion sizes, energy, or hunger need fine-tuning.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Starting Weight"
                value={`${startingWeightKg} kg`}
                disabled
                className="bg-slate-900/50"
              />
              <Input
                label="Current Weight (kg)"
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="e.g. 73.2"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Weeks Following This Plan: <span className="text-emerald-400 font-bold">{weeksElapsed} weeks</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={weeksElapsed}
                onChange={(e) => setWeeksElapsed(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>1 week</span>
                <span>3 weeks (Recommended)</span>
                <span>8 weeks</span>
              </div>
            </div>

            {/* Hunger Level */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Daily Hunger & Appetite Level (1 to 5):
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { level: 1, label: 'Very Full' },
                  { level: 2, label: 'Comfortable' },
                  { level: 3, label: 'Moderate' },
                  { level: 4, label: 'Often Hungry' },
                  { level: 5, label: 'Ravenous' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setHungerRating(item.level)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      hungerRating === item.level
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm">{item.level}</div>
                    <div className="text-[10px] leading-tight mt-0.5">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Adherence */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Plan Adherence Consistency (1 to 5):
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { level: 1, label: '<50%' },
                  { level: 2, label: '60%' },
                  { level: 3, label: '75%' },
                  { level: 4, label: '90%' },
                  { level: 5, label: '100% On Track' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setAdherenceRating(item.level)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      adherenceRating === item.level
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm">{item.level}</div>
                    <div className="text-[10px] leading-tight mt-0.5">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="glow" onClick={handleRunReview} className="flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Calculate Adaptive Advice
              </Button>
            </div>
          </div>
        ) : (
          /* Review Results View */
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    reviewResult.status === 'optimal_progress'
                      ? 'emerald'
                      : reviewResult.status === 'rapid_loss'
                      ? 'amber'
                      : 'blue'
                  }
                >
                  {reviewResult.status === 'optimal_progress'
                    ? 'Optimal Pace'
                    : reviewResult.status === 'rapid_loss'
                    ? 'Fast Drop'
                    : 'Fine-Tuning'}
                </Badge>
                <div className="text-xs text-slate-400">
                  Weight change:{' '}
                  <span
                    className={`font-bold ${
                      reviewResult.weightChangeKg <= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {reviewResult.weightChangeKg > 0 ? `+${reviewResult.weightChangeKg}` : reviewResult.weightChangeKg} kg
                  </span>
                </div>
              </div>

              <h4 className="text-base font-bold text-white leading-snug">
                {reviewResult.headline}
              </h4>
            </div>

            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Evidence-Based Action Items
              </h5>
              <div className="space-y-2">
                {reviewResult.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={handleReset}>
                Re-check With Different Numbers
              </Button>
              <Button variant="glow" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

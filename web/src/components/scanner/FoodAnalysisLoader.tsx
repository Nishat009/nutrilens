'use client';

import React from 'react';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

interface FoodAnalysisLoaderProps {
  imagePreview: string;
  step: number; // 1: Reading, 2: Identifying, 3: Estimating, 4: Calculating
  progress: number; // 0 to 100
}

const STEPS = [
  { id: 1, label: 'Reading and validating your photo' },
  { id: 2, label: 'Identifying food items with Open Vision Model' },
  { id: 3, label: 'Estimating portion sizes (g/ml)' },
  { id: 4, label: 'Querying nutrition tables & calculating macros' },
];

export function FoodAnalysisLoader({
  imagePreview,
  step,
  progress,
}: FoodAnalysisLoaderProps) {
  return (
    <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
      {/* Laser Scanning Visual Viewport */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden bg-slate-900 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Analyzing meal"
            className="w-full h-full object-cover opacity-60 scale-105"
          />
        )}
        {/* Animated Laser Scanning Line */}
        <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan shadow-lg shadow-emerald-400 z-10" />
        <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px]" />
        <div className="relative z-10 p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-emerald-400">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      {/* Progress Heading & Checklist */}
      <div className="space-y-4 max-w-md w-full px-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white">Analyzing Your Meal...</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hybrid Open AI Food Classifier + Nutrition Database
          </p>
        </div>

        <ProgressBar value={progress} max={100} variant="gradient" size="md" />

        {/* Step Checklist */}
        <div className="space-y-2 text-left pt-2">
          {STEPS.map((s) => {
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                    : isCurrent
                    ? 'bg-slate-800/80 border-slate-700 text-white font-bold shadow-md'
                    : 'bg-slate-900/40 border-slate-800/50 text-slate-500'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : isCurrent
                      ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                  ) : (
                    s.id
                  )}
                </div>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

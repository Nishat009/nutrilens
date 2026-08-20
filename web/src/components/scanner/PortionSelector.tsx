'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface PortionSelectorProps {
  quantity: number;
  unit: string;
  onChange: (newQuantity: number) => void;
  step?: number;
  presets?: number[];
  min?: number;
  max?: number;
}

export function PortionSelector({
  quantity,
  unit,
  onChange,
  step = 25,
  presets = [50, 100, 150, 200, 250],
  min = 10,
  max = 1000,
}: PortionSelectorProps) {
  const handleDecrement = () => {
    onChange(Math.max(min, quantity - step));
  };

  const handleIncrement = () => {
    onChange(Math.min(max, quantity + step));
  };

  return (
    <div className="space-y-2">
      {/* Stepper Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= min}
          aria-label="Decrease portion"
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 focus-within:border-emerald-500 transition-colors">
          <input
            type="number"
            min={min}
            max={max}
            value={quantity}
            onChange={(e) => onChange(Number(e.target.value) || min)}
            className="w-14 bg-transparent text-center font-bold text-xs text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[11px] text-slate-400 font-medium ml-1 select-none">{unit}</span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={quantity >= max}
          aria-label="Increase portion"
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Preset Chips */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                quantity === preset
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              {preset}
              {unit.startsWith('g') ? 'g' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

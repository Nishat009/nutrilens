'use client';

import React from 'react';
import { Vegetable } from '../../lib/types/vegetable';
import { Card } from '../ui/Card';
import { Flame, Sparkles, Scale, Info } from 'lucide-react';
import { cn } from '../../lib/utils/format';

interface VegetableCardProps {
  vegetable: Vegetable;
  onSelect: (veg: Vegetable) => void;
}

const CATEGORY_COLORS: Record<string, { badge: string; border: string; glow: string }> = {
  'Root Vegetables': { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', border: 'hover:border-amber-500/40', glow: 'group-hover:shadow-amber-500/10' },
  'Leafy Greens': { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', border: 'hover:border-emerald-500/40', glow: 'group-hover:shadow-emerald-500/10' },
  'Cruciferous': { badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30', border: 'hover:border-teal-500/40', glow: 'group-hover:shadow-teal-500/10' },
  'Nightshades': { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', border: 'hover:border-rose-500/40', glow: 'group-hover:shadow-rose-500/10' },
  'Gourds & Squashes': { badge: 'bg-green-500/10 text-green-400 border-green-500/30', border: 'hover:border-green-500/40', glow: 'group-hover:shadow-green-500/10' },
  'Podded & Legumes': { badge: 'bg-lime-500/10 text-lime-400 border-lime-500/30', border: 'hover:border-lime-500/40', glow: 'group-hover:shadow-lime-500/10' },
  'Allium': { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', border: 'hover:border-purple-500/40', glow: 'group-hover:shadow-purple-500/10' },
  'Mushroom & Fungi': { badge: 'bg-stone-500/10 text-stone-300 border-stone-500/30', border: 'hover:border-stone-400/40', glow: 'group-hover:shadow-stone-500/10' },
  'Stems & Shoots': { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', border: 'hover:border-cyan-500/40', glow: 'group-hover:shadow-cyan-500/10' },
  'Fruit Vegetables': { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', border: 'hover:border-orange-500/40', glow: 'group-hover:shadow-orange-500/10' },
  'Tubers & Corms': { badge: 'bg-amber-600/10 text-amber-300 border-amber-600/30', border: 'hover:border-amber-600/40', glow: 'group-hover:shadow-amber-600/10' },
  'Herbs & Aromatics': { badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30', border: 'hover:border-emerald-400/40', glow: 'group-hover:shadow-emerald-400/10' },
};

export function VegetableCard({ vegetable, onSelect }: VegetableCardProps) {
  const style = CATEGORY_COLORS[vegetable.category] || {
    badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    border: 'hover:border-slate-500/40',
    glow: 'group-hover:shadow-slate-500/10',
  };

  // Find regional Bengali or English aliases
  const topAliases = (vegetable.aliases || []).slice(0, 3);

  return (
    <Card
      onClick={() => onSelect(vegetable)}
      className={cn(
        'group cursor-pointer transition-all duration-300 bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] shadow-lg',
        style.border,
        style.glow
      )}
    >
      <div className="space-y-4">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider',
              style.badge
            )}
          >
            {vegetable.category}
          </span>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Scale className="w-3 h-3 text-slate-400" /> 100g raw
          </span>
        </div>

        {/* Name & Botanical Info */}
        <div>
          <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
            {vegetable.name}
          </h3>
          {vegetable.scientificName && (
            <p className="text-[11px] text-slate-500 italic mt-0.5">{vegetable.scientificName}</p>
          )}

          {/* Regional Aliases (Bengali / Transliterated) */}
          {topAliases.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {topAliases.map((alias, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
                >
                  {alias}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {vegetable.description}
        </p>
      </div>

      {/* Nutrition Footprint per 100g */}
      <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-3">
        {/* Calories Highlight */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm">
            <Flame className="w-4 h-4 fill-amber-400/20 text-amber-400" />
            <span>{vegetable.caloriesPer100g} kcal</span>
          </div>
          <span className="text-[11px] text-emerald-400 group-hover:underline flex items-center gap-1 font-semibold">
            Calculate portion <Info className="w-3 h-3" />
          </span>
        </div>

        {/* Macro Pill Grid */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-1.5">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">Prot</span>
            <span className="text-xs font-bold text-sky-400">{vegetable.proteinPer100g}g</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-1.5">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">Carb</span>
            <span className="text-xs font-bold text-amber-400">{vegetable.carbsPer100g}g</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-1.5">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">Fat</span>
            <span className="text-xs font-bold text-rose-400">{vegetable.fatPer100g}g</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-1.5">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">Fiber</span>
            <span className="text-xs font-bold text-emerald-400">{vegetable.fiberPer100g}g</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

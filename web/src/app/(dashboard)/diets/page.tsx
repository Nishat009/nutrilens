'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  Fish,
  Dumbbell,
  Flame,
  Leaf,
  Clock,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { MOCK_DIETS } from '../../../data/mock/diets';

const iconMap: Record<string, React.ReactNode> = {
  Fish: <Fish className="w-6 h-6" />,
  Dumbbell: <Dumbbell className="w-6 h-6" />,
  Flame: <Flame className="w-6 h-6" />,
  Leaf: <Leaf className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  HeartPulse: <HeartPulse className="w-6 h-6" />,
};

export default function DietsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" /> Evidence-Based Nutrition
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Scientific Diet Protocols
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Explore clinically documented nutritional strategies tailored for longevity, lean mass retention, or metabolic flexibility.
        </p>
      </div>

      {/* Grid of Diets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_DIETS.map((diet) => {
          return (
            <Card
              key={diet.id}
              variant="glass"
              isHoverable
              className="p-6 border-slate-800 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
                    {iconMap[diet.icon] || <Sparkles className="w-6 h-6" />}
                  </div>
                  <Badge variant={diet.difficulty === 'Easy' ? 'emerald' : diet.difficulty === 'Moderate' ? 'blue' : 'amber'}>
                    {diet.difficulty}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {diet.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {diet.description}
                  </p>
                </div>

                {/* Macro Ratio Mini Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-400">
                    <span className="text-purple-400">{diet.macroRatio.protein}% P</span>
                    <span className="text-amber-400">{diet.macroRatio.carbs}% C</span>
                    <span className="text-rose-400">{diet.macroRatio.fat}% F</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-slate-800">
                    <div className="bg-purple-500" style={{ width: `${diet.macroRatio.protein}%` }} />
                    <div className="bg-amber-500" style={{ width: `${diet.macroRatio.carbs}%` }} />
                    <div className="bg-rose-500" style={{ width: `${diet.macroRatio.fat}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <Link href={`/diets/${diet.slug}`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-between group-hover:border-emerald-500/50">
                    <span>Explore Protocol</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

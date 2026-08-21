'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  Utensils,
  Check,
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DietPlan } from '../../../../lib/types';
import { dietApi } from '../../../../services/api-client';
import { useUserStore } from '../../../../lib/stores/user-store';

export default function DietDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { profile, updateProfile } = useUserStore();

  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdopting, setIsAdopting] = useState(false);

  useEffect(() => {
    if (slug) {
      setIsLoading(true);
      dietApi
        .getDietBySlug(slug)
        .then((data) => {
          setDiet(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to load diet details from backend:', err);
          setIsLoading(false);
        });
    }
  }, [slug]);

  const isAdopted = diet && profile.dietaryPreferences?.includes(diet.name);

  const handleAdopt = async () => {
    if (!diet) return;
    setIsAdopting(true);
    try {
      await dietApi.adoptDiet(diet.name);
      if (!profile.dietaryPreferences.includes(diet.name)) {
        await updateProfile({
          dietaryPreferences: [...(profile.dietaryPreferences || []), diet.name],
        });
      }
    } catch (err) {
      console.error('Failed to adopt diet:', err);
    } finally {
      setIsAdopting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading diet protocol from backend...</p>
      </div>
    );
  }

  if (!diet) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-white">Diet Protocol Not Found</h2>
        <Link href="/diets">
          <Button variant="glow">Back to Diets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/diets">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Diet Explorer
          </Button>
        </Link>
        <Badge variant="emerald">{diet.difficulty} Difficulty</Badge>
      </div>

      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800 space-y-4">
        <h1 className="text-3xl sm:text-4xl font-black text-white">{diet.name}</h1>
        <p className="text-sm sm:text-base text-emerald-400 font-medium">{diet.tagline}</p>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{diet.fullOverview}</p>

        {/* Macro Distribution */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 max-w-md">
          <div className="flex justify-between text-xs font-bold font-mono">
            <span className="text-purple-400">{diet.macroRatio?.protein || 30}% Protein</span>
            <span className="text-amber-400">{diet.macroRatio?.carbs || 40}% Carbs</span>
            <span className="text-rose-400">{diet.macroRatio?.fat || 30}% Fat</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-800">
            <div className="bg-purple-500" style={{ width: `${diet.macroRatio?.protein || 30}%` }} />
            <div className="bg-amber-500" style={{ width: `${diet.macroRatio?.carbs || 40}%` }} />
            <div className="bg-rose-500" style={{ width: `${diet.macroRatio?.fat || 30}%` }} />
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant={isAdopted ? 'secondary' : 'glow'}
            onClick={handleAdopt}
            isLoading={isAdopting}
            leftIcon={isAdopted ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
          >
            {isAdopted ? 'Active Protocol Selected' : 'Adopt This Protocol'}
          </Button>
        </div>
      </div>

      {/* Key Benefits */}
      <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Clinical & Physiological Benefits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(diet.keyBenefits || []).map((benefit, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Allowed Foods vs Foods to Limit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass" className="p-6 border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Foundation Foods
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {(diet.allowedFoods || []).map((item, i) => (
              <li key={i} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="glass" className="p-6 border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <XCircle className="w-5 h-5" /> Foods to Minimize
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {(diet.foodsToLimit || []).map((item, i) => (
              <li key={i} className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Sample 1-Day Meal Protocol */}
      {diet.sampleMealDay && (
        <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-400" /> Sample Daily Blueprint
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase text-amber-400">Breakfast</span>
              <p className="text-xs text-slate-300 leading-relaxed">{diet.sampleMealDay.breakfast}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase text-emerald-400">Lunch</span>
              <p className="text-xs text-slate-300 leading-relaxed">{diet.sampleMealDay.lunch}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase text-purple-400">Dinner</span>
              <p className="text-xs text-slate-300 leading-relaxed">{diet.sampleMealDay.dinner}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase text-cyan-400">Snack & Recovery</span>
              <p className="text-xs text-slate-300 leading-relaxed">{diet.sampleMealDay.snack}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

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
  AlertTriangle,
  HeartPulse,
  Flame,
  Target,
  Scale,
  ListOrdered,
  Activity,
} from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { DietPlan } from '../../../../lib/types';
import { dietApi } from '../../../../services/api-client';
import { useUserStore } from '../../../../lib/stores/user-store';
import { MOCK_DIETS } from '../../../../data/mock/diets';

export default function DietDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { profile, goal, updateProfile, updateGoal, fetchUserProfile } = useUserStore();

  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdopting, setIsAdopting] = useState(false);

  useEffect(() => {
    if (slug) {
      setIsLoading(true);
      dietApi
        .getDietBySlug(slug)
        .then((data) => {
          if (data) {
            setDiet(data);
          } else {
            const fallback = MOCK_DIETS.find((d) => d.slug === slug);
            setDiet(fallback || null);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to load diet details from backend, checking catalog:', err);
          const fallback = MOCK_DIETS.find((d) => d.slug === slug);
          setDiet(fallback || null);
          setIsLoading(false);
        });
    }
  }, [slug]);

  const isAdopted = diet && profile.dietaryPreferences?.includes(diet.name);

  const [adoptionAlert, setAdoptionAlert] = useState<{
    status: string;
    message: string;
    action?: string;
  } | null>(null);

  const handleAdopt = async () => {
    if (!diet) return;
    setIsAdopting(true);
    setAdoptionAlert(null);
    try {
      const res = await dietApi.adoptDiet(diet.id || diet.slug);

      if (res && res.canAdopt === false) {
        setAdoptionAlert({
          status: res.status,
          message: res.message,
          action: res.requiredAction,
        });
        setIsAdopting(false);
        return;
      }

      const targetCalories = goal.targetCalories || 2000;
      const pPercent = diet.macroRatio?.protein || 30;
      const cPercent = diet.macroRatio?.carbs || 40;
      const fPercent = diet.macroRatio?.fat || 30;

      const targetProteinG = Math.round((targetCalories * (pPercent / 100)) / 4);
      const targetCarbsG = Math.round((targetCalories * (cPercent / 100)) / 4);
      const targetFatG = Math.round((targetCalories * (fPercent / 100)) / 9);

      await updateProfile({
        dietaryPreferences: [diet.name],
        activeDietId: diet.id || diet.slug,
      });

      await updateGoal({
        targetProteinG,
        targetCarbsG,
        targetFatG,
      });

      await fetchUserProfile();
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Back Button & Difficulty */}
      <div className="flex items-center justify-between">
        <Link href="/diets">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Diet Explorer
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {diet.isFeatured && <Badge variant="emerald">Featured Protocol</Badge>}
          <Badge
            variant={
              diet.difficulty === 'Easy'
                ? 'emerald'
                : diet.difficulty === 'Moderate'
                ? 'blue'
                : 'amber'
            }
          >
            {diet.difficulty} Difficulty
          </Badge>
        </div>
      </div>

      {/* Adoption Alert Banner (Clinical Safety / Blocked) */}
      {adoptionAlert && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 shadow-xl animate-in fade-in slide-in-from-top-2 ${
            adoptionAlert.status === 'PROFESSIONAL_REVIEW'
              ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs sm:text-sm">
            <p className="font-bold text-white">
              {adoptionAlert.status === 'PROFESSIONAL_REVIEW'
                ? 'Clinical Review Recommended'
                : 'Protocol Not Recommended for Current Profile'}
            </p>
            <p className="text-slate-300 leading-relaxed">{adoptionAlert.message}</p>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-slate-900/95 border border-slate-800 space-y-5 shadow-2xl">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{diet.name}</h1>
          <p className="text-sm sm:text-base text-emerald-400 font-medium">{diet.tagline}</p>
        </div>

        {/* Target Profile Tags */}
        <div className="flex flex-wrap gap-2 pt-1">
          {diet.targetAudience && (
            <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target: {diet.targetAudience}</span>
            </div>
          )}
          {diet.targetWeightCategory && (
            <div className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>Target Weight: {diet.targetWeightCategory}</span>
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{diet.fullOverview}</p>

        {/* Macro Distribution */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 max-w-md">
          <div className="flex justify-between text-xs font-bold font-mono">
            <span className="text-purple-400">
              {diet.macroRatio?.protein_percent
                ? `${diet.macroRatio.protein_percent.min}-${diet.macroRatio.protein_percent.max}%`
                : `${diet.macroRatio?.protein || 30}%`}{' '}
              Protein
            </span>
            <span className="text-amber-400">
              {diet.macroRatio?.carbohydrate_percent
                ? `${diet.macroRatio.carbohydrate_percent.min}-${diet.macroRatio.carbohydrate_percent.max}%`
                : `${diet.macroRatio?.carbs || 35}%`}{' '}
              Carbs
            </span>
            <span className="text-rose-400">
              {diet.macroRatio?.fat_percent
                ? `${diet.macroRatio.fat_percent.min}-${diet.macroRatio.fat_percent.max}%`
                : `${diet.macroRatio?.fat || 35}%`}{' '}
              Fat
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-800">
            <div className="bg-purple-500" style={{ width: `${diet.macroRatio?.protein || 30}%` }} />
            <div className="bg-amber-500" style={{ width: `${diet.macroRatio?.carbs || 35}%` }} />
            <div className="bg-rose-500" style={{ width: `${diet.macroRatio?.fat || 35}%` }} />
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant={isAdopted ? 'secondary' : 'glow'}
            size="lg"
            onClick={handleAdopt}
            isLoading={isAdopting}
            leftIcon={isAdopted ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
          >
            {isAdopted ? 'Active Protocol Selected' : 'Adopt This Protocol'}
          </Button>
        </div>
      </div>

      {/* Evidence & Clinical Mechanism Profile */}
      {diet.evidence_profile && (
        <Card
          variant="glass"
          className="p-6 sm:p-7 border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-emerald-950/20 space-y-3 shadow-lg shadow-emerald-500/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
              <HeartPulse className="w-4 h-4" />
              <span>Evidence & Physiological Mechanism</span>
            </div>
            {diet.evidence_profile.evidence_level && (
              <Badge variant="emerald" size="sm">
                Evidence: {diet.evidence_profile.evidence_level.toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-medium">
            {diet.evidence_profile.mechanism_summary}
          </p>
          {diet.evidence_profile.potential_benefits && diet.evidence_profile.potential_benefits.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {diet.evidence_profile.potential_benefits.map((b, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium"
                >
                  ✓ {b}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}


      {/* Suitability & Medical Recommendations */}
      {diet.suitability && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" className="p-6 border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Recommended For
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(diet.suitability.recommendedFor || []).map((item, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="p-6 border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Contraindications & Precautions
            </h3>
            <div className="space-y-1.5 text-xs text-slate-300">
              {(diet.suitability.contraindications || []).map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 text-amber-200/90"
                >
                  ⚠️ {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Key Clinical Benefits */}
      <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Clinical & Physiological Benefits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(diet.keyBenefits || []).map((benefit, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Actionable Daily Guidelines */}
      {diet.guidelines && diet.guidelines.length > 0 && (
        <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-emerald-400" /> Daily Practical Guidelines
          </h3>
          <div className="space-y-2.5">
            {diet.guidelines.map((guideline, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  {i + 1}
                </div>
                <span className="mt-0.5">{guideline}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Foundation Foods vs Foods to Limit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass" className="p-6 border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Foundation Foods
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {(diet.allowedFoods || []).map((item, i) => (
              <li
                key={i}
                className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2"
              >
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
              <li
                key={i}
                className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Sample 1-Day Bangladeshi Meal Blueprint */}
      {diet.sampleMealDay && (
        <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-400" /> Sample 1-Day Deshi Blueprint
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


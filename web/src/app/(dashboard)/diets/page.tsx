'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Shield,
  Target,
  Sliders,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DietPlan, PersonalizedDietPlan } from '../../../lib/types';
import { dietApi } from '../../../services/api-client';
import { useUserStore } from '../../../lib/stores/user-store';
import { generatePersonalizedDietRecommendation } from '../../../services/diet-recommender';
import { PersonalizedDietPlanView } from '../../../components/diets/PersonalizedDietPlanView';

const iconMap: Record<string, React.ReactNode> = {
  Fish: <Fish className="w-6 h-6" />,
  Dumbbell: <Dumbbell className="w-6 h-6" />,
  Flame: <Flame className="w-6 h-6" />,
  Leaf: <Leaf className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  HeartPulse: <HeartPulse className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
};

export default function DietsPage() {
  const { profile, fetchUserProfile } = useUserStore();
  const [activeTab, setActiveTab] = useState<'personalized' | 'protocols'>('personalized');
  const [diets, setDiets] = useState<DietPlan[]>([]);
  const [isLoadingDiets, setIsLoadingDiets] = useState(true);
  const [personalizedPlan, setPersonalizedPlan] = useState<PersonalizedDietPlan | null>(null);

  useEffect(() => {
    fetchUserProfile();

    dietApi
      .getDiets()
      .then((data) => {
        setDiets(data);
        setIsLoadingDiets(false);
      })
      .catch((err) => {
        console.warn('Failed to load diets from backend:', err);
        setIsLoadingDiets(false);
      });
  }, [fetchUserProfile]);

  // Generate / Load Personalized Plan whenever profile is available
  useEffect(() => {
    if (profile) {
      const plan = generatePersonalizedDietRecommendation(profile);
      setPersonalizedPlan(plan);
    }
  }, [profile]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Evidence-Based Nutrition
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Diet Protocols & Personalized Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personalized meal distributions, Bangladeshi staple adaptations, and scientific protocols.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('personalized')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'personalized'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> My Personalized Plan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('protocols')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'protocols'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> All 7 Protocols
          </button>
        </div>
      </div>

      {/* TAB 1: PERSONALIZED PLAN */}
      {activeTab === 'personalized' && (
        <div>
          {personalizedPlan ? (
            <PersonalizedDietPlanView
              plan={personalizedPlan}
              onPlanUpdate={(updated) => setPersonalizedPlan(updated)}
            />
          ) : (
            <Card variant="glass" className="p-12 text-center border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Generate Your Personalized Plan</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Complete our fast 8-step onboarding assessment to match with the ideal diet protocol, calorie target, and 7-day Bangladeshi meal schedule.
              </p>
              <Link href="/onboarding">
                <Button variant="glow" className="mt-2">
                  Launch Personalization Wizard <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: ALL 7 SCIENTIFIC PROTOCOLS CATALOGUE */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Complete Scientific Diet Library
            </h2>
            <span className="text-xs text-slate-500">7 Peer-Documented Strategies</span>
          </div>

          {isLoadingDiets ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading diet protocols from backend...</p>
            </div>
          ) : diets.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <p className="text-xs text-slate-400">No diet protocols available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diets.map((diet) => (
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
                      <Badge
                        variant={
                          diet.difficulty === 'Easy'
                            ? 'emerald'
                            : diet.difficulty === 'Moderate'
                            ? 'blue'
                            : 'amber'
                        }
                      >
                        {diet.difficulty}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {diet.name}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-3">
                        {diet.description}
                      </p>
                    </div>

                    {/* Macro Ratio Mini Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-400">
                        <span className="text-purple-400">{diet.macroRatio?.protein || 30}% P</span>
                        <span className="text-amber-400">{diet.macroRatio?.carbs || 40}% C</span>
                        <span className="text-rose-400">{diet.macroRatio?.fat || 30}% F</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden flex bg-slate-800">
                        <div
                          className="bg-purple-500"
                          style={{ width: `${diet.macroRatio?.protein || 30}%` }}
                        />
                        <div
                          className="bg-amber-500"
                          style={{ width: `${diet.macroRatio?.carbs || 40}%` }}
                        />
                        <div
                          className="bg-rose-500"
                          style={{ width: `${diet.macroRatio?.fat || 30}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80">
                    <Link href={`/diets/${diet.slug}`} className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between group-hover:border-emerald-500/50"
                      >
                        <span>Explore Protocol</span>
                        <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

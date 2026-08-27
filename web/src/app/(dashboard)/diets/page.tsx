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
  Activity,
  Search,
  CheckCircle2,
  Filter,
  Heart,
  Droplets,
  Sun,
  Moon,
  Smile,
  Feather,
  Apple,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DietPlan } from '../../../lib/types';
import { dietApi } from '../../../services/api-client';
import { MOCK_DIETS } from '../../../data/mock/diets';

const iconMap: Record<string, React.ReactNode> = {
  Fish: <Fish className="w-6 h-6" />,
  Dumbbell: <Dumbbell className="w-6 h-6" />,
  Flame: <Flame className="w-6 h-6" />,
  Leaf: <Leaf className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  HeartPulse: <HeartPulse className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Activity: <Activity className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Droplets: <Droplets className="w-6 h-6" />,
  Sun: <Sun className="w-6 h-6" />,
  Moon: <Moon className="w-6 h-6" />,
  Smile: <Smile className="w-6 h-6" />,
  Feather: <Feather className="w-6 h-6" />,
  Apple: <Apple className="w-6 h-6" />,
};

const CATEGORIES = [
  { id: 'all', label: 'All Protocols' },
  { id: 'pcos_hormone', label: 'PCOS & Hormones' },
  { id: 'thyroid_metabolic', label: 'Thyroid & Metabolism' },
  { id: 'insulin_fatloss', label: 'Insulin & Fat Loss' },
  { id: 'fertility_postpartum', label: 'Fertility & Postpartum' },
  { id: 'gut_detox', label: 'Gut & Anti-Bloat' },
  { id: 'cardio_liver', label: 'Cardio, Liver & Uric' },
];

export default function DietsPage() {
  const [diets, setDiets] = useState<DietPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    dietApi
      .getDiets()
      .then((data) => {
        if (data && data.length > 0) {
          setDiets(data);
        } else {
          setDiets(MOCK_DIETS);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load diets from backend, using catalog:', err);
        setDiets(MOCK_DIETS);
        setIsLoading(false);
      });
  }, []);

  const filteredDiets = useMemo(() => {
    return diets.filter((diet) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        diet.name.toLowerCase().includes(q) ||
        diet.description.toLowerCase().includes(q) ||
        diet.targetAudience?.toLowerCase().includes(q) ||
        diet.pcosAndThyroidBenefits?.toLowerCase().includes(q) ||
        diet.suitability?.recommendedFor?.some((r) => r.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'pcos_hormone') {
        return (
          diet.slug.includes('pcos') ||
          diet.slug.includes('estrogen') ||
          diet.slug.includes('pmdd') ||
          diet.slug.includes('menopause') ||
          diet.slug.includes('cortisol')
        );
      }
      if (selectedCategory === 'thyroid_metabolic') {
        return (
          diet.slug.includes('hypothyroidism') ||
          diet.slug.includes('lean-muscle') ||
          diet.slug.includes('weight-gain')
        );
      }
      if (selectedCategory === 'insulin_fatloss') {
        return (
          diet.slug.includes('insulin') ||
          diet.slug.includes('keto') ||
          diet.slug.includes('fasting')
        );
      }
      if (selectedCategory === 'fertility_postpartum') {
        return (
          diet.slug.includes('fertility') ||
          diet.slug.includes('pregnancy') ||
          diet.slug.includes('anemia') ||
          diet.slug.includes('collagen')
        );
      }
      if (selectedCategory === 'gut_detox') {
        return (
          diet.slug.includes('gut') ||
          diet.slug.includes('bloat') ||
          diet.slug.includes('plant-based')
        );
      }
      if (selectedCategory === 'cardio_liver') {
        return (
          diet.slug.includes('dash') ||
          diet.slug.includes('fatty-liver') ||
          diet.slug.includes('uric') ||
          diet.slug.includes('mediterranean')
        );
      }
      return true;
    });
  }, [diets, searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" /> Evidence-Based Deshi Protocols
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Hormone, Metabolic & Clinical Diets
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Comprehensive clinical nutritional strategies tailored for PCOS, Hypothyroidism, Insulin Resistance,
          Fertility, Gut Healing, and Long-Term Vitality using Bangladeshi staples.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by condition (e.g. PCOS, Thyroid, Bloating, Uric Acid, Fertility, Keto)..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
              Clear
            </Button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading clinical diet protocols...</p>
        </div>
      ) : filteredDiets.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl border border-dashed border-slate-800 space-y-3 bg-slate-900/30">
          <Filter className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white">No diet protocols matched your search</p>
          <p className="text-xs text-slate-400">Try adjusting your keywords or category filters.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* Grid of Diets */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiets.map((diet) => {
            return (
              <Card
                key={diet.slug || diet.id}
                variant="glass"
                isHoverable
                className="p-6 border-slate-800 flex flex-col justify-between space-y-6 group transition-all duration-300 hover:border-emerald-500/40"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
                      {iconMap[diet.icon] || <Sparkles className="w-6 h-6" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {diet.isFeatured && (
                        <Badge variant="emerald" size="sm">
                          Featured
                        </Badge>
                      )}
                      <Badge
                        variant={
                          diet.difficulty === 'Easy'
                            ? 'emerald'
                            : diet.difficulty === 'Moderate'
                            ? 'blue'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {diet.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {diet.name}
                    </h3>
                    {diet.targetAudience && (
                      <p className="text-[11px] font-medium text-emerald-400/90 mt-0.5 line-clamp-1">
                        🎯 {diet.targetAudience}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-2">
                      {diet.description}
                    </p>
                  </div>

                  {/* Macro Ratio Mini Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-400">
                      <span className="text-purple-400">{diet.macroRatio?.protein || 30}% Protein</span>
                      <span className="text-amber-400">{diet.macroRatio?.carbs || 35}% Carbs</span>
                      <span className="text-rose-400">{diet.macroRatio?.fat || 35}% Fat</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden flex bg-slate-800">
                      <div className="bg-purple-500" style={{ width: `${diet.macroRatio?.protein || 30}%` }} />
                      <div className="bg-amber-500" style={{ width: `${diet.macroRatio?.carbs || 35}%` }} />
                      <div className="bg-rose-500" style={{ width: `${diet.macroRatio?.fat || 35}%` }} />
                    </div>
                  </div>

                  {/* Recommended For Chips */}
                  {diet.suitability?.recommendedFor && diet.suitability.recommendedFor.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {diet.suitability.recommendedFor.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] border border-slate-700/50"
                        >
                          {item}
                        </span>
                      ))}
                      {diet.suitability.recommendedFor.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-800/50 text-slate-500 text-[10px]">
                          +{diet.suitability.recommendedFor.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <Link href={`/diets/${diet.slug}`} className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5"
                    >
                      <span>Explore Full Protocol</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


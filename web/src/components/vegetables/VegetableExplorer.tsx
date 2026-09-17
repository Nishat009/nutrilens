'use client';

import React, { useState, useEffect } from 'react';
import { Vegetable, VegetableCategory } from '../../lib/types/vegetable';
import { vegetableApi } from '../../services/vegetable-api';
import { VegetableCard } from './VegetableCard';
import { VegetableDetailModal } from './VegetableDetailModal';
import { VegetableSearch } from './VegetableSearch';
import {
  Sparkles,
  Leaf,
  Filter,
  ArrowUpDown,
  BookOpen,
  Scale,
  ShieldCheck,
  Flame,
  Loader2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils/format';

const CATEGORIES: VegetableCategory[] = [
  'All',
  'Root Vegetables',
  'Leafy Greens',
  'Cruciferous',
  'Nightshades',
  'Gourds & Squashes',
  'Podded & Legumes',
  'Allium',
  'Mushroom & Fungi',
  'Stems & Shoots',
  'Fruit Vegetables',
  'Tubers & Corms',
  'Herbs & Aromatics',
];

export function VegetableExplorer() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'calories' | 'protein' | 'fiber' | 'carbs'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVegetable, setSelectedVegetable] = useState<Vegetable | null>(null);

  useEffect(() => {
    vegetableApi
      .getCategories()
      .then((catList) => {
        if (catList && catList.length > 0) {
          const names = ['All', ...catList.map((c) => c.category)];
          setCategories(Array.from(new Set(names)));
        }
      })
      .catch(() => {
        // keep fallback categories
      });
  }, []);

  const fetchVegetables = async () => {
    setIsLoading(true);
    try {
      const data = await vegetableApi.getVegetables({
        category: selectedCategory as any,
        search: searchQuery,
        sortBy,
        order: sortOrder,
        limit: 120,
      });
      setVegetables(data.vegetables);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Failed to load vegetables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVegetables();
  }, [selectedCategory, sortBy, sortOrder, searchQuery]);


  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Leaf className="w-3.5 h-3.5" /> Dedicated Vegetable Database
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> USDA FoodData Central Sourced
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {totalCount} Researched Botanical Items
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Vegetable Nutrition Explorer
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Verified nutritional database for international & South Asian vegetables. Standardized to{' '}
            <strong className="text-emerald-400 font-semibold">100g raw edible portion</strong> baseline. Zero AI hallucinations — every calorie and macronutrient is deterministic and verified.
          </p>

          {/* Quick Search Bar */}
          <div className="pt-2">
            <VegetableSearch
              onSelectVegetable={(veg) => setSelectedVegetable(veg)}
              placeholder="Search 105+ vegetables (English, বাংলা, Hindi aliases)..."
            />
          </div>
        </div>
      </div>

      {/* Category Pills & Sorting Bar */}
      <div className="space-y-4">
        {/* Category Filter Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              )}
            >
              {cat}
            </button>
          ))}
        </div>


        {/* Filter and Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Showing {vegetables.length} vegetables</span>
            {selectedCategory !== 'All' && (
              <span className="text-emerald-400 font-normal">in {selectedCategory}</span>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="name">Name (A-Z)</option>
              <option value="calories">Lowest Calories</option>
              <option value="protein">Highest Protein</option>
              <option value="fiber">Highest Fiber</option>
              <option value="carbs">Lowest Carbs</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title={`Order: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vegetable Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading vegetable database...</p>
        </div>
      ) : vegetables.length === 0 ? (
        <Card className="p-12 text-center space-y-4 bg-slate-900/40 border-slate-800">
          <Leaf className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white">No vegetables found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try switching category or clearing your search filters.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {vegetables.map((veg) => (
            <VegetableCard
              key={veg._id || veg.slug}
              vegetable={veg}
              onSelect={(v) => setSelectedVegetable(v)}
            />
          ))}
        </div>
      )}

      {/* Selected Vegetable Modal with Stepper */}
      <VegetableDetailModal
        vegetable={selectedVegetable}
        onClose={() => setSelectedVegetable(null)}
      />
    </div>
  );
}

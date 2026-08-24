'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Sparkles, Flame, Scale } from 'lucide-react';
import { Vegetable } from '../../lib/types/vegetable';
import { vegetableApi } from '../../services/vegetable-api';
import { cn } from '../../lib/utils/format';

interface VegetableSearchProps {
  onSelectVegetable: (veg: Vegetable) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function VegetableSearch({
  onSelectVegetable,
  placeholder = 'Search vegetables by name or alias (e.g., Carrot, বেগুন, Korola, Spinach)...',
  autoFocus = false,
}: VegetableSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Vegetable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const data = await vegetableApi.searchVegetables(query);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error('Vegetable search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleSelect = (veg: Vegetable) => {
    onSelectVegetable(veg);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full">
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-slate-500 shadow-xl transition-all"
        />

        {isLoading ? (
          <Loader2 className="absolute right-4 w-5 h-5 text-emerald-400 animate-spin" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-3.5 w-6 h-6 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Instant Search Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>USDA Verified Vegetable Database</span>
            <span>{results.length} results</span>
          </div>

          {results.length === 0 && !isLoading ? (
            <div className="p-6 text-center text-sm text-slate-400 space-y-1">
              <p>No vegetable found matching &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500">
                Try searching in English, Bengali (e.g. বেগুন, করলা), or botanical category.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {results.map((veg) => (
                <div
                  key={veg._id || veg.slug}
                  onClick={() => handleSelect(veg)}
                  className="p-3.5 hover:bg-slate-800/70 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                        {veg.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-semibold">
                        {veg.category}
                      </span>
                    </div>

                    {/* Regional Aliases */}
                    {veg.aliases && veg.aliases.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {veg.aliases.slice(0, 3).map((al, i) => (
                          <span
                            key={i}
                            className="text-[10px] text-slate-400 bg-slate-950/60 px-1.5 py-0.2 rounded border border-slate-800"
                          >
                            {al}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nutrients Badge */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 font-black text-amber-400 text-sm">
                      <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                      <span>{veg.caloriesPer100g} kcal</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">per 100g raw</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

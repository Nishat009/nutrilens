'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, Carrot, Apple, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { adminApi } from '../../../../services/api-client';
import { useAuthStore } from '../../../../lib/stores/auth-store';
import { AdminCatalog, AdminCatalogItem, CatalogType } from '../../../../lib/types/admin';
import { cn } from '../../../../lib/utils/format';
import { PageHeader, Pagination } from '../../../../components/admin/admin-ui';

const TABS: { type: CatalogType; label: string; icon: React.ElementType }[] = [
  { type: 'vegetables', label: 'Vegetables', icon: Carrot },
  { type: 'foods', label: 'Foods', icon: Apple },
];

export default function AdminCatalogPage() {
  const { user } = useAuthStore();
  const [type, setType] = useState<CatalogType>('vegetables');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminCatalog | null>(null);
  const [error, setError] = useState('');
  const [toggleError, setToggleError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await adminApi.getCatalog({ type, search, category, page, limit: 12 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the catalogue.');
    }
  }, [type, search, category, page]);

  useEffect(() => {
    load();
  }, [load]);

  const switchTab = (next: CatalogType) => {
    setType(next);
    setCategory('');
    setPage(1);
    setData(null);
  };

  const togglePublished = async (item: AdminCatalogItem) => {
    setTogglingId(item.id);
    setToggleError('');
    try {
      const updated = await adminApi.setVegetablePublished(item.id, !item.isActive);
      setData((current) =>
        current && {
          ...current,
          items: current.items.map((entry) => (entry.id === item.id ? { ...entry, isActive: updated.isActive } : entry)),
        }
      );
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Could not update this vegetable.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food catalogue"
        description="Verified nutrition records behind the scanner, meal logging and the vegetable explorer. Values are per serving (vegetables per 100 g raw edible portion)."
      />

      <Card padding="none">
        <div className="flex flex-col lg:flex-row gap-3 p-4 border-b border-slate-800/80">
          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800 self-start">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => switchTab(tab.type)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    type === tab.type ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex-1">
            <Input
              aria-label={`Search ${type}`}
              placeholder={`Search ${type} by name`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All categories</option>
            {(data?.categories || []).map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.name} ({entry.count})
              </option>
            ))}
          </select>
        </div>

        {toggleError && (
          <div role="alert" className="mx-4 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{toggleError}</div>
        )}

        {error ? (
          <div className="p-4"><ErrorState message={error} onRetry={load} /></div>
        ) : !data ? (
          <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-11 w-full" />)}</div>
        ) : data.items.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<Search className="w-6 h-6" />} title="Nothing found" description="Try another name or category." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
                  <th className="font-semibold px-4 py-3">Item</th>
                  <th className="font-semibold px-4 py-3">Serving</th>
                  <th className="font-semibold px-4 py-3 text-right">kcal</th>
                  <th className="font-semibold px-4 py-3 text-right">Protein</th>
                  <th className="font-semibold px-4 py-3 text-right">Carbs</th>
                  <th className="font-semibold px-4 py-3 text-right">Fat</th>
                  <th className="font-semibold px-4 py-3 text-right">Fiber</th>
                  {type === 'vegetables' && <th className="font-semibold px-4 py-3 text-right">Explorer</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.items.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white truncate max-w-[280px]">{entry.name}</div>
                      <div className="text-[11px] text-slate-500">{entry.category}{entry.source ? ` · ${entry.source}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{entry.serving}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-white font-semibold">{Math.round(entry.calories)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">{entry.protein}g</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">{entry.carbs}g</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">{entry.fat}g</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">{entry.fiber}g</td>
                    {type === 'vegetables' && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => togglePublished(entry)}
                          disabled={togglingId === entry.id || user?.isDemo}
                          title={user?.isDemo ? 'Read-only on the shared demo admin' : entry.isActive ? 'Hide from the vegetable explorer' : 'Publish to the vegetable explorer'}
                          className="disabled:cursor-not-allowed cursor-pointer"
                        >
                          {entry.isActive ? (
                            <Badge variant="emerald" size="sm"><Eye className="w-3 h-3" />Published</Badge>
                          ) : (
                            <Badge variant="slate" size="sm"><EyeOff className="w-3 h-3" />Hidden</Badge>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}

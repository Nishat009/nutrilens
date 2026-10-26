'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ShieldAlert, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { adminApi } from '../../../../services/api-client';
import { AdminDietCatalog, AdminDietProtocol } from '../../../../lib/types/admin';
import { cn } from '../../../../lib/utils/format';
import { BarList, PageHeader, humanize } from '../../../../components/admin/admin-ui';

const EVIDENCE_VARIANT: Record<string, 'emerald' | 'blue' | 'amber' | 'slate'> = {
  strong: 'emerald',
  moderate: 'blue',
  traditional: 'amber',
};

const range = (value: { min: number; max: number } | null) => (value ? `${value.min}–${value.max}%` : '—');

function ProtocolCard({ protocol }: { protocol: AdminDietProtocol }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white leading-snug">{protocol.name}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{protocol.tagline}</p>
        </div>
        <Badge variant={EVIDENCE_VARIANT[protocol.evidenceLevel] || 'slate'} size="sm">{protocol.evidenceLevel}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Protein', value: protocol.macros.protein, tone: 'text-purple-300' },
          { label: 'Carbs', value: protocol.macros.carbs, tone: 'text-amber-300' },
          { label: 'Fat', value: protocol.macros.fat, tone: 'text-rose-300' },
        ].map((macro) => (
          <div key={macro.label} className="rounded-xl bg-slate-950/60 border border-slate-800 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{macro.label}</div>
            <div className={cn('text-xs font-bold tabular-nums', macro.tone)}>{range(macro.value)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" size="sm">{humanize(protocol.category)}</Badge>
        <Badge variant="outline" size="sm">{protocol.difficulty}</Badge>
        {protocol.suitableConditions.slice(0, 3).map((condition) => (
          <Badge key={condition} variant="slate" size="sm">{humanize(condition)}</Badge>
        ))}
      </div>

      {protocol.requiresProfessionalReview.length > 0 && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-300/90 leading-snug">
          <ShieldAlert className="w-3.5 h-3.5 mt-px shrink-0" />
          Professional review for: {protocol.requiresProfessionalReview.map(humanize).join(', ')}
        </p>
      )}
    </article>
  );
}

export default function AdminDietsPage() {
  const [data, setData] = useState<AdminDietCatalog | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await adminApi.getDiets());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load diet protocols.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => Array.from(new Set((data?.protocols || []).map((protocol) => protocol.category))).sort(), [data]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.protocols || []).filter(
      (protocol) =>
        (!category || protocol.category === category) &&
        (!term || `${protocol.name} ${protocol.tagline} ${protocol.suitableConditions.join(' ')}`.toLowerCase().includes(term))
    );
  }, [data, search, category]);

  if (error) return <ErrorState title="Diet protocols unavailable" message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diet protocols"
        description="The canonical clinical catalogue the recommendation engine draws from: macro ranges, evidence grade and the cases that require professional review."
      />

      {!data ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <Card className="xl:col-span-1 h-fit">
            <CardHeader>
              <div>
                <CardTitle>Member adoption</CardTitle>
                <CardDescription>Plans assigned by the assessment</CardDescription>
              </div>
            </CardHeader>
            <BarList rows={data.adoption.map((row) => ({ label: row.diet, value: row.count }))} emptyText="No plans assigned yet." />
          </Card>

          <div className="xl:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  aria-label="Search protocols"
                  placeholder="Search by name or condition (e.g. PCOS, gout)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All categories ({data.protocols.length})</option>
                {categories.map((name) => (
                  <option key={name} value={name}>{humanize(name)}</option>
                ))}
              </select>
            </div>

            {visible.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visible.map((protocol) => <ProtocolCard key={protocol.id} protocol={protocol} />)}
              </div>
            ) : (
              <EmptyState icon={<BookOpen className="w-6 h-6" />} title="No protocols match" description="Clear the search or pick another category." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

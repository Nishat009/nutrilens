'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ScanLine, CalendarClock, Target, AlertTriangle, Brain } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { adminApi } from '../../../../services/api-client';
import { AdminScanList } from '../../../../lib/types/admin';
import {
  ConfidencePill,
  PageHeader,
  Pagination,
  StatTile,
  humanize,
  percent,
  shortDate,
} from '../../../../components/admin/admin-ui';

export default function AdminScansPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminScanList | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await adminApi.getScans({ page, limit: 12 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load scan activity.');
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState title="Scan activity unavailable" message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI scan activity"
        description="Every photo analysed by the on-device vision pipeline, with per-item detection confidence and the corrections members taught it."
      />

      {!data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="card" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Total scans" value={data.stats.total} hint={`${data.stats.detectedItems} food items detected`} icon={<ScanLine className="w-4 h-4" />} accent="purple" />
            <StatTile label="Last 7 days" value={data.stats.last7d} hint="Photos analysed this week" icon={<CalendarClock className="w-4 h-4" />} />
            <StatTile label="Avg confidence" value={percent(data.stats.avgConfidence)} hint="Mean per detected item" icon={<Target className="w-4 h-4" />} accent="blue" />
            <StatTile
              label="Low confidence"
              value={data.stats.lowConfidenceItems}
              hint="Items under 70% — members confirm or swap these"
              icon={<AlertTriangle className="w-4 h-4" />}
              accent="amber"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Recent scans</CardTitle>
                  <CardDescription>Newest first, across all members</CardDescription>
                </div>
              </CardHeader>
              {data.scans.length === 0 ? (
                <EmptyState icon={<ScanLine className="w-6 h-6" />} title="No scans yet" description="Scans appear here as soon as members photograph a meal." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.scans.map((scan) => (
                      <article key={scan.id} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                        {scan.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={scan.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            <ScanLine className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white truncate">{scan.userName}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">{shortDate(scan.createdAt)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {scan.items.slice(0, 3).map((entry, index) => (
                              <span key={`${entry.name}-${index}`} className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-slate-800/80 border border-slate-700/60 rounded-md px-1.5 py-0.5">
                                <span className="truncate max-w-[110px]">{entry.name}</span>
                                <ConfidencePill value={entry.confidence} />
                              </span>
                            ))}
                            {scan.items.length > 3 && <span className="text-[10px] text-slate-500">+{scan.items.length - 3} more</span>}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Badge variant="slate" size="sm">{humanize(scan.mealType)}</Badge>
                            <span className="tabular-nums">{Math.round(scan.totalCalories)} kcal</span>
                            <span className="tabular-nums">P {Math.round(scan.totalProtein)}g</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
                </>
              )}
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Visual memory</CardTitle>
                  <CardDescription>{data.stats.learnedMatches} corrections stored as 64-bit dHash fingerprints</CardDescription>
                </div>
              </CardHeader>
              {data.learned.length ? (
                <ul className="divide-y divide-slate-800/80">
                  {data.learned.map((match) => (
                    <li key={match.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                      <div className="min-w-0">
                        <div className="text-slate-200 font-medium truncate">{match.foodName}</div>
                        <div className="text-slate-500">{match.category} · updated {shortDate(match.updatedAt)}</div>
                      </div>
                      <span className="text-slate-300 tabular-nums shrink-0">×{match.learnedCount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 px-4">
                  <Brain className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm text-white font-semibold">Nothing learned yet</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    When a member corrects a detection or picks a similar-food candidate, the photo&apos;s fingerprint is saved here and reused on the next matching scan.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Users, ClipboardCheck, UtensilsCrossed, ScanLine, BookOpen, Apple, Carrot, Brain, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { adminApi } from '../../../services/api-client';
import { AdminOverview } from '../../../lib/types/admin';
import { getTodayDateString } from '../../../lib/utils/format';
import {
  BarList,
  ConfidencePill,
  Initials,
  PageHeader,
  StatTile,
  goalLabel,
  humanize,
  percent,
  shortDate,
} from '../../../components/admin/admin-ui';

// Validated categorical pair for the dark chart surface (see dataviz palette check).
const SERIES = { meals: '#059669', scans: '#8b5cf6' };

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await adminApi.getOverview(getTodayDateString()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the overview.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState title="Overview unavailable" message={error} onRetry={load} />;

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="card" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const { totals } = data;
  const completion = totals.members ? totals.onboardedMembers / totals.members : null;
  const mealsLast14 = data.activity.reduce((sum, day) => sum + day.meals, 0);
  const scansLast14 = data.activity.reduce((sum, day) => sum + day.scans, 0);
  const chartData = data.activity.map((day) => ({ ...day, label: shortDate(day.date) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Live numbers from MongoDB across every member, logged meal and AI food scan."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Members"
          value={totals.members}
          hint={`+${totals.newMembers7d} joined in the last 7 days`}
          icon={<Users className="w-4 h-4" />}
        />
        <StatTile
          label="Assessment done"
          value={percent(completion)}
          hint={`${totals.onboardedMembers} of ${totals.members} finished the 8-step assessment`}
          icon={<ClipboardCheck className="w-4 h-4" />}
          accent="blue"
        />
        <StatTile
          label="Meals logged"
          value={totals.meals.toLocaleString('en-US')}
          hint={`${mealsLast14} in the last 14 days`}
          icon={<UtensilsCrossed className="w-4 h-4" />}
          accent="amber"
        />
        <StatTile
          label="AI food scans"
          value={totals.scans.toLocaleString('en-US')}
          hint={`${percent(data.avgScanConfidence)} average detection confidence`}
          icon={<ScanLine className="w-4 h-4" />}
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-col sm:flex-row items-start sm:items-center">
            <div>
              <CardTitle>Daily activity · last 14 days</CardTitle>
              <CardDescription>
                {mealsLast14} meals and {scansLast14} AI scans logged across all members
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: SERIES.meals }} /> Meals logged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: SERIES.scans }} /> AI scans
              </span>
            </div>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: '#475569', strokeWidth: 1 }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                  itemStyle={{ color: '#cbd5e1' }}
                />
                <Line type="monotone" dataKey="meals" name="Meals logged" stroke={SERIES.meals} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#0f172a' }} />
                <Line type="monotone" dataKey="scans" name="AI scans" stroke={SERIES.scans} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#0f172a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Assigned diet plans</CardTitle>
              <CardDescription>Protocol chosen by each member&apos;s assessment</CardDescription>
            </div>
          </CardHeader>
          <BarList
            rows={data.dietAdoption.map((row) => ({ label: row.diet, value: row.count }))}
            emptyText="No member has completed the assessment yet."
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Members by goal</CardTitle>
              <CardDescription>Primary goal from onboarding</CardDescription>
            </div>
          </CardHeader>
          <BarList rows={data.goals.map((row) => ({ label: goalLabel(row.goal), value: row.count }))} emptyText="No members yet." />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Health conditions</CardTitle>
              <CardDescription>Drives the 5-tier clinical food checks</CardDescription>
            </div>
          </CardHeader>
          {data.conditions.length ? (
            <div className="flex flex-wrap gap-2">
              {data.conditions.map((row) => (
                <span key={row.condition} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200">
                  {humanize(row.condition)}
                  <span className="text-slate-400 tabular-nums">{row.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No health conditions reported.</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Meals by type</CardTitle>
              <CardDescription>All-time count and average energy</CardDescription>
            </div>
          </CardHeader>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="font-semibold pb-2">Type</th>
                <th className="font-semibold pb-2 text-right">Meals</th>
                <th className="font-semibold pb-2 text-right">Avg kcal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {data.mealTypes.map((row) => (
                <tr key={row.type}>
                  <td className="py-2 text-slate-200">{humanize(row.type)}</td>
                  <td className="py-2 text-right tabular-nums text-slate-300">{row.count}</td>
                  <td className="py-2 text-right tabular-nums text-slate-300">{row.avgCalories}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Newest members</CardTitle>
            <Link href="/admin/users" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1">
              All members <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <ul className="divide-y divide-slate-800/80">
            {data.recentMembers.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-3">
                <Initials name={member.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{member.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {member.dietName || goalLabel(member.primaryGoal)}
                  </div>
                </div>
                {member.onboardingCompleted ? (
                  <Badge variant="emerald" size="sm">Active plan</Badge>
                ) : (
                  <Badge variant="amber" size="sm">Assessment pending</Badge>
                )}
                <span className="text-[11px] text-slate-500 w-14 text-right">{shortDate(member.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest AI scans</CardTitle>
            <Link href="/admin/scans" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1">
              Scan activity <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <ul className="divide-y divide-slate-800/80">
            {data.recentScans.map((scan) => (
              <li key={scan.id} className="flex items-center gap-3 py-3">
                {scan.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scan.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-800" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <ScanLine className="w-4 h-4 text-slate-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{scan.items.map((entry) => entry.name).slice(0, 2).join(', ')}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {scan.userName} · {Math.round(scan.totalCalories)} kcal
                  </div>
                </div>
                <ConfidencePill value={scan.avgConfidence} />
              </li>
            ))}
            {!data.recentScans.length && <li className="py-6 text-center text-xs text-slate-500">No scans yet.</li>}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Diet protocols" value={totals.dietProtocols} hint="Evidence-graded catalogue" icon={<BookOpen className="w-4 h-4" />} accent="blue" />
        <StatTile label="Foods" value={totals.foods} hint="Verified nutrition records" icon={<Apple className="w-4 h-4" />} accent="rose" />
        <StatTile
          label="Vegetables"
          value={totals.publishedVegetables}
          hint={`${totals.vegetables - totals.publishedVegetables} hidden from the explorer`}
          icon={<Carrot className="w-4 h-4" />}
          accent="amber"
        />
        <StatTile label="Visual memory" value={totals.learnedMatches} hint="Learned scan corrections (dHash)" icon={<Brain className="w-4 h-4" />} accent="purple" />
      </div>
    </div>
  );
}

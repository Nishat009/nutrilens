'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Flame,
  Dumbbell,
  Calendar,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useUserStore } from '../../../lib/stores/user-store';
import { formatCalories, formatGrams, toLocalDateString } from '../../../lib/utils/format';
import { progressApi } from '../../../services/api-client';
import { DailyNutrition, WeightLog } from '../../../lib/types';

export default function ProgressPage() {
  const { profile, goal, fetchUserProfile } = useUserStore();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightError, setWeightError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionHistory, setNutritionHistory] = useState<DailyNutrition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);

  const daysCount = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  const loadProgressData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [logs, history] = await Promise.all([
        progressApi.getWeightLogs(),
        progressApi.getNutritionHistory({ days: daysCount }),
      ]);
      setWeightLogs(logs);
      setNutritionHistory(history);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load progress data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile().catch((error) => console.error('Could not load saved profile:', error));
    loadProgressData();
  }, [daysCount]);

  // Merge real nutrition history and weigh-ins into one timeline. Days without a
  // record stay null so the charts show gaps instead of invented values.
  const chartData = useMemo(() => {
    const cutoff = toLocalDateString(new Date(Date.now() - daysCount * 24 * 60 * 60 * 1000));
    const byDate = new Map<string, {
      date: string;
      calories: number | null;
      protein: number | null;
      carbs: number | null;
      fat: number | null;
      weight: number | null;
    }>();
    const entry = (date: string) => {
      if (!byDate.has(date)) {
        byDate.set(date, { date, calories: null, protein: null, carbs: null, fat: null, weight: null });
      }
      return byDate.get(date)!;
    };

    nutritionHistory.forEach((item) => {
      const e = entry(item.date);
      e.calories = item.totalCalories;
      e.protein = item.totalProtein;
      e.carbs = item.totalCarbs;
      e.fat = item.totalFat;
    });
    weightLogs
      .filter((w) => w.date >= cutoff)
      .forEach((w) => {
        entry(w.date).weight = w.weightKg;
      });

    return Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ ...e, date: e.date.slice(5) }));
  }, [nutritionHistory, weightLogs, daysCount]);

  const weighIns = chartData.filter((d) => d.weight !== null).map((d) => d.weight as number);
  const weightDelta = weighIns.length > 1
    ? Math.round((weighIns[weighIns.length - 1] - weighIns[0]) * 10) / 10
    : 0;
  const hasChartData = chartData.length > 0;

  const openWeightModal = () => {
    setWeightError('');
    setNewWeight(profile.weightKg ? profile.weightKg.toString() : '');
    setIsWeightModalOpen(true);
  };

  const handleSaveWeight = async () => {
    const val = parseFloat(newWeight);
    if (isNaN(val) || val <= 0) {
      setWeightError('Please enter a valid weight in kg.');
      return;
    }

    setIsSubmittingWeight(true);
    setWeightError('');
    try {
      // The server also updates the profile's current weight.
      await progressApi.logWeight({ weightKg: val });
      await fetchUserProfile();
      await loadProgressData();
      setIsWeightModalOpen(false);
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : 'Failed to save weigh-in.');
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header & Date Range Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Progress & Health Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Visualize your biometric trends, caloric adherence, and body composition
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  range === r
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            variant="glow"
            size="sm"
            onClick={openWeightModal}
            leftIcon={<Scale className="w-4 h-4" />}
          >
            Log Weight
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/40 text-xs text-rose-300">{loadError}</div>
      )}
      {!isLoading && !loadError && !hasChartData && (
        <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/60 text-xs text-slate-400">
          No meals or weigh-ins logged in this period yet. Log a meal or your weight to see your trends.
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Net Weight Change</span>
            <div className="text-2xl font-black text-white">
              {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              Target: {profile.targetWeightKg} kg
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <TrendingDown className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Daily Calorie Target</span>
            <div className="text-2xl font-black text-white">{formatCalories(goal.targetCalories)} kcal</div>
            <div className="text-[11px] text-emerald-400 font-medium">Adaptive Baseline</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Flame className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Daily Protein Target</span>
            <div className="text-2xl font-black text-purple-300">{goal.targetProteinG}g</div>
            <div className="text-[11px] text-purple-400 font-medium">
              {((goal.targetProteinG / (profile.weightKg || 1))).toFixed(2)}g / kg body mass
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Dumbbell className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Chart 1: Weight Trend Line Chart */}
      <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Weight Progression (kg)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live weigh-in records from MongoDB database
            </p>
          </div>
          <Badge variant="emerald">Live Backend Data</Badge>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                name="Weight (kg)"
                connectNulls
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chart 2: Caloric Intake vs Target Bar Chart */}
      <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Daily Calorie Balance</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily intake (bars) plotted against your {goal.targetCalories} kcal goal baseline
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="calories" name="Consumed (kcal)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chart 3: Macronutrient Stacked Area Breakdown */}
      <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Macronutrient Distribution (grams)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily protein (violet), carbs (amber), and fat (rose) intake curves
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
              <Area type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
              <Area type="monotone" dataKey="fat" name="Fat (g)" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick Log Weight Modal */}
      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Log Today's Body Weight"
        description="Weigh-ins are recorded directly into your MongoDB account history."
      >
        <div className="space-y-4">
          <Input
            label="Weight in Kilograms (kg)"
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
          />
          {weightError && <p className="text-xs text-rose-400">{weightError}</p>}
          <Button
            variant="glow"
            className="w-full"
            isLoading={isSubmittingWeight}
            onClick={handleSaveWeight}
          >
            Save Weigh-In
          </Button>
        </div>
      </Modal>
    </div>
  );
}

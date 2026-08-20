'use client';

import React, { useState, useMemo } from 'react';
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
import { MOCK_WEIGHT_LOGS, MOCK_DAILY_HISTORY } from '../../../data/mock/progress';
import { useUserStore } from '../../../lib/stores/user-store';
import { formatCalories, formatGrams } from '../../../lib/utils/format';

export default function ProgressPage() {
  const { profile, goal } = useUserStore();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState(profile.weightKg.toString());

  const daysCount = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  const chartData = useMemo(() => {
    return MOCK_DAILY_HISTORY.slice(-daysCount).map((item, idx) => {
      const weightEntry = MOCK_WEIGHT_LOGS[MOCK_WEIGHT_LOGS.length - daysCount + idx];
      return {
        date: item.date.slice(5), // MM-DD
        calories: item.totalCalories,
        targetCalories: goal.targetCalories,
        protein: item.totalProtein,
        carbs: item.totalCarbs,
        fat: item.totalFat,
        weight: weightEntry ? weightEntry.weightKg : null,
      };
    });
  }, [daysCount, goal.targetCalories]);

  const initialWeight = chartData[0]?.weight || profile.weightKg;
  const latestWeight = chartData[chartData.length - 1]?.weight || profile.weightKg;
  const weightDelta = Math.round((latestWeight - initialWeight) * 10) / 10;

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
            onClick={() => setIsWeightModalOpen(true)}
            leftIcon={<Scale className="w-4 h-4" />}
          >
            Log Weight
          </Button>
        </div>
      </div>

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
            <span className="text-xs font-bold uppercase text-slate-400">Avg Caloric Pacing</span>
            <div className="text-2xl font-black text-white">2,110 kcal</div>
            <div className="text-[11px] text-emerald-400 font-medium">98.2% Adherence Rate</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Flame className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Avg Daily Protein</span>
            <div className="text-2xl font-black text-purple-300">162g</div>
            <div className="text-[11px] text-purple-400 font-medium">2.18g / kg body mass</div>
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
              Consistent downward trend toward {profile.targetWeightKg}kg goal
            </p>
          </div>
          <Badge variant="emerald">On Track</Badge>
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
        description="Weigh-ins are best recorded first thing in the morning."
      >
        <div className="space-y-4">
          <Input
            label="Weight in Kilograms (kg)"
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
          />
          <Button
            variant="glow"
            className="w-full"
            onClick={() => {
              setIsWeightModalOpen(false);
            }}
          >
            Save Weigh-In
          </Button>
        </div>
      </Modal>
    </div>
  );
}

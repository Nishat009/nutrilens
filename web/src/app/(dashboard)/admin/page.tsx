'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, Layers, Plus, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { foodApi } from '../../../services/api-client';
import { Food } from '../../../lib/types';

const emptyForm = {
  name: '',
  category: '',
  servingSize: '100',
  servingUnit: 'g',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  tags: '',
};

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const loadFoods = useCallback(async () => {
    setLoadError('');
    try {
      setFoods(await foodApi.getFoods());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load the food catalogue.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const categories = useMemo(() => new Set(foods.map((food) => food.category)).size, [foods]);

  const visibleFoods = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return foods;
    return foods.filter(
      (food) =>
        food.name.toLowerCase().includes(query) ||
        food.category.toLowerCase().includes(query) ||
        (food.tags || []).some((tag) => tag.toLowerCase().includes(query))
    );
  }, [foods, search]);

  const setField = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setNotice('');

    const numbers = {
      servingSize: Number(form.servingSize),
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      fiber: form.fiber === '' ? 0 : Number(form.fiber),
    };
    if (!form.name.trim() || !form.category.trim() || !form.servingUnit.trim()) {
      setFormError('Name, category and serving unit are required.');
      return;
    }
    if (Object.values(numbers).some((value) => !Number.isFinite(value) || value < 0) || numbers.servingSize <= 0) {
      setFormError('Serving size and nutrition values must be non-negative numbers.');
      return;
    }
    if (form.calories === '' || form.protein === '' || form.carbs === '' || form.fat === '') {
      setFormError('Calories, protein, carbs and fat are required.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await foodApi.createFood({
        name: form.name.trim(),
        category: form.category.trim(),
        servingSize: numbers.servingSize,
        servingUnit: form.servingUnit.trim(),
        nutrition: {
          calories: numbers.calories,
          protein: numbers.protein,
          carbs: numbers.carbs,
          fat: numbers.fat,
          fiber: numbers.fiber,
        },
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      setFoods((current) => [created, ...current]);
      setForm(emptyForm);
      setNotice(`Added "${created.name}" to the shared catalogue.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add the food.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <Card variant="glass" className="max-w-xl mx-auto text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <h1 className="text-xl font-black text-white">Admin access required</h1>
        <p className="text-sm text-slate-400">Your account is not allowed to manage the shared food catalogue.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
          <ShieldCheck className="w-7 h-7 text-emerald-400" /> Admin Panel
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage the shared food catalogue used by the scanner and meal logging.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card variant="glass" className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{isLoading ? '—' : foods.length}</div>
            <div className="text-xs text-slate-400">Foods in catalogue</div>
          </div>
        </Card>
        <Card variant="glass" className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{isLoading ? '—' : categories}</div>
            <div className="text-xs text-slate-400">Categories</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <Card variant="glass" className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4">Add a food</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Name" value={form.name} onChange={setField('name')} placeholder="e.g. Lentil Soup" />
            <Input label="Category" value={form.category} onChange={setField('category')} placeholder="e.g. Soups" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Serving size" type="number" min="0" step="any" value={form.servingSize} onChange={setField('servingSize')} />
              <Input label="Serving unit" value={form.servingUnit} onChange={setField('servingUnit')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Calories" type="number" min="0" step="any" value={form.calories} onChange={setField('calories')} suffix="kcal" />
              <Input label="Protein" type="number" min="0" step="any" value={form.protein} onChange={setField('protein')} suffix="g" />
              <Input label="Carbs" type="number" min="0" step="any" value={form.carbs} onChange={setField('carbs')} suffix="g" />
              <Input label="Fat" type="number" min="0" step="any" value={form.fat} onChange={setField('fat')} suffix="g" />
              <Input label="Fiber" type="number" min="0" step="any" value={form.fiber} onChange={setField('fiber')} suffix="g" />
            </div>
            <Input label="Tags" value={form.tags} onChange={setField('tags')} helperText="Comma-separated, optional" />

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">{formError}</div>
            )}
            {notice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">{notice}</div>
            )}

            <Button type="submit" variant="glow" className="w-full" isLoading={isSaving} leftIcon={<Plus className="w-4 h-4" />}>
              Add to catalogue
            </Button>
          </form>
        </Card>

        <Card variant="glass" className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-white">Catalogue</h2>
            <div className="w-full sm:w-64">
              <Input
                aria-label="Search foods"
                placeholder="Search name, category, tag"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          {loadError ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">{loadError}</div>
          ) : isLoading ? (
            <p className="text-sm text-slate-400">Loading catalogue…</p>
          ) : visibleFoods.length === 0 ? (
            <p className="text-sm text-slate-400">No foods match your search.</p>
          ) : (
            <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-800/80">
              {visibleFoods.map((food) => (
                <div key={food.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{food.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <Badge variant="slate" size="sm">{food.category}</Badge>
                      <span>
                        per {food.servingSize}
                        {food.servingUnit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-300 shrink-0">
                    <div className="font-bold text-white">{Math.round(food.nutrition.calories)} kcal</div>
                    <div className="text-slate-400">
                      P {food.nutrition.protein} · C {food.nutrition.carbs} · F {food.nutrition.fat}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

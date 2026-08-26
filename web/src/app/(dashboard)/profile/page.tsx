'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Sparkles,
  Scale,
  Activity,
  Target,
  RefreshCw,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { useUserStore } from '../../../lib/stores/user-store';
import { useAuthStore } from '../../../lib/stores/auth-store';
import { calculateNutritionTargets } from '../../../services/nutrition';
import {
  ACTIVITY_LEVEL_DETAILS,
  DIETARY_PREFERENCES_LIST,
  GOAL_OPTIONS,
} from '../../../lib/constants';
import { ActivityLevel, Gender, GoalType } from '../../../lib/types';
import { formatCalories, formatGrams, cmToFeetInches, feetInchesToCm } from '../../../lib/utils/format';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, goal, updateProfile, setGoalType, recalculateTargets, fetchUserProfile } = useUserStore();
  const { logout } = useAuthStore();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [dob, setDob] = useState(profile.dob);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [targetWeightKg, setTargetWeightKg] = useState(profile.targetWeightKg || 72.0);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(goal.type);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(profile.dietaryPreferences || []);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setDob(profile.dob);
    setGender(profile.gender);
    setHeightCm(profile.heightCm);
    setWeightKg(profile.weightKg);
    setTargetWeightKg(profile.targetWeightKg || 72.0);
    setActivityLevel(profile.activityLevel);
    setDietaryPrefs(profile.dietaryPreferences || []);
    setSelectedGoal(goal.type);
  }, [profile, goal]);

  const toggleDietPref = (pref: string) => {
    if (dietaryPrefs.includes(pref)) {
      setDietaryPrefs(dietaryPrefs.filter((p) => p !== pref));
    } else {
      setDietaryPrefs([...dietaryPrefs, pref]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        email,
        dob,
        gender,
        heightCm,
        weightKg,
        targetWeightKg,
        activityLevel,
        dietaryPreferences: dietaryPrefs,
      });
      await setGoalType(selectedGoal);
      await recalculateTargets();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const calculated = calculateNutritionTargets(
    { gender, dob, heightCm, weightKg, activityLevel },
    selectedGoal
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Health Profile & Biometrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage your physiological data and adaptive nutrition prescription
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          leftIcon={<LogOut className="w-4 h-4 text-rose-400" />}
          className="border-slate-800 text-rose-300 hover:bg-rose-950/30"
        >
          Sign Out
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile updated and daily nutritional targets saved to database!</span>
        </div>
      )}

      {/* Profile Card Header */}
      <Card variant="glass" className="p-6 sm:p-8 border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 p-1 shadow-xl shadow-emerald-500/20 shrink-0">
          <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-xl font-black text-emerald-400">
            {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'NL'}
          </div>
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            <Badge variant="emerald">Pro Member</Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono">{profile.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-slate-300">
            <span>BMI: <strong className="text-white">{calculated.bmi}</strong> ({calculated.bmiCategory})</span>
            <span>•</span>
            <span>BMR: <strong className="text-white">{calculated.bmr} kcal</strong></span>
            <span>•</span>
            <span>TDEE: <strong className="text-white">{calculated.tdee} kcal</strong></span>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Biometrics Settings Form */}
        <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" /> Biometric Measurements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />

            <Select
              label="Biological Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
              ]}
            />

            {/* Height with Unit Converter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Height ({heightUnit === 'cm' ? 'cm' : 'ft / in'})
                </label>
                <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setHeightUnit('cm')}
                    className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      heightUnit === 'cm'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit('ft')}
                    className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      heightUnit === 'ft'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ft / in
                  </button>
                </div>
              </div>

              {heightUnit === 'cm' ? (
                <div className="relative">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    required
                    min="100"
                    max="250"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    ≈ {cmToFeetInches(heightCm).text}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Feet (ft)</label>
                    <select
                      value={cmToFeetInches(heightCm).feet}
                      onChange={(e) =>
                        setHeightCm(
                          feetInchesToCm(Number(e.target.value), cmToFeetInches(heightCm).inches)
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {[4, 5, 6, 7].map((f) => (
                        <option key={f} value={f}>
                          {f} ft
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Inches (in)</label>
                    <select
                      value={cmToFeetInches(heightCm).inches}
                      onChange={(e) =>
                        setHeightCm(
                          feetInchesToCm(cmToFeetInches(heightCm).feet, Number(e.target.value))
                        )
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                        <option key={inch} value={inch}>
                          {inch} in
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Current Weight (kg)"
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              required
            />

            <Input
              label="Target Goal Weight (kg)"
              type="number"
              step="0.1"
              value={targetWeightKg}
              onChange={(e) => setTargetWeightKg(Number(e.target.value))}
              required
            />

            <Select
              label="Physical Activity Level"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              options={(Object.keys(ACTIVITY_LEVEL_DETAILS) as ActivityLevel[]).map((k) => ({
                label: `${ACTIVITY_LEVEL_DETAILS[k].label} - ${ACTIVITY_LEVEL_DETAILS[k].desc}`,
                value: k,
              }))}
            />
          </div>
        </Card>

        {/* Primary Goal & Protocols */}
        <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" /> Target Protocol & Preferences
          </h3>

          <div className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Active Focus Goal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(GOAL_OPTIONS) as GoalType[]).map((g) => {
                const opt = GOAL_OPTIONS[g];
                const isSelected = selectedGoal === g;

                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGoal(g)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold text-white">{opt.label}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Dietary Preferences & Habits
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_PREFERENCES_LIST.map((pref) => {
                const active = dietaryPrefs.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleDietPref(pref)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pref}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Live Recalculation Preview */}
        <Card variant="gradient" className="p-6 sm:p-8 border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Recalculated Prescription
            </span>
            <Badge variant="emerald">Adaptive Engine</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Daily Calories</div>
              <div className="text-xl font-black text-white mt-0.5">
                {formatCalories(calculated.targetCalories)}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">kcal/day</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] text-purple-400 font-semibold uppercase">Protein</div>
              <div className="text-xl font-black text-purple-300 mt-0.5">
                {calculated.targetProteinG}g
              </div>
              <div className="text-[10px] text-slate-400 font-medium">target</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] text-amber-400 font-semibold uppercase">Carbs</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                {calculated.targetCarbsG}g
              </div>
              <div className="text-[10px] text-slate-400 font-medium">target</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] text-rose-400 font-semibold uppercase">Fats</div>
              <div className="text-xl font-black text-rose-300 mt-0.5">
                {calculated.targetFatG}g
              </div>
              <div className="text-[10px] text-slate-400 font-medium">target</div>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="glow"
          size="lg"
          className="w-full text-base font-bold"
          isLoading={isSaving}
          leftIcon={<Sparkles className="w-5 h-5 stroke-[2.5]" />}
        >
          Save Changes & Update Targets in Database
        </Button>
      </form>
    </div>
  );
}

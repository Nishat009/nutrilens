'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Activity,
  Flame,
  Scale,
  Utensils,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { useUserStore } from '../../../lib/stores/user-store';
import { calculateNutritionTargets } from '../../../services/nutrition';
import {
  ACTIVITY_LEVEL_DETAILS,
  DIETARY_PREFERENCES_LIST,
  GOAL_OPTIONS,
} from '../../../lib/constants';
import { ActivityLevel, Gender, GoalType } from '../../../lib/types';
import { formatCalories } from '../../../lib/utils/format';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile, setGoalType, recalculateTargets } = useUserStore();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State initialized from mock/active user
  const [name, setName] = useState(profile.name || 'Alex Morgan');
  const [dob, setDob] = useState(profile.dob || '1998-05-14');
  const [gender, setGender] = useState<Gender>(profile.gender || 'male');
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm || 178);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg || 74.5);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(profile.targetWeightKg || 72.0);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel || 'moderately_active');
  const [goal, setGoal] = useState<GoalType>('lose_weight');
  const [selectedDietPrefs, setSelectedDietPrefs] = useState<string[]>(profile.dietaryPreferences || []);

  const toggleDietPref = (pref: string) => {
    if (selectedDietPrefs.includes(pref)) {
      setSelectedDietPrefs(selectedDietPrefs.filter((p) => p !== pref));
    } else {
      setSelectedDietPrefs([...selectedDietPrefs, pref]);
    }
  };

  // Live calculation for preview
  const calculated = calculateNutritionTargets(
    { gender, dob, heightCm, weightKg, activityLevel },
    goal
  );

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Finalize and save to backend database
      await updateProfile({
        name,
        dob,
        gender,
        heightCm,
        weightKg,
        targetWeightKg,
        activityLevel,
        dietaryPreferences: selectedDietPrefs,
      });
      await setGoalType(goal);
      await recalculateTargets();
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Progress */}
      <div className="max-w-2xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="font-bold text-base text-white">NutriLens Setup</span>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Step {step} of {totalSteps}
          </span>
        </div>
        <ProgressBar value={step} max={totalSteps} variant="gradient" size="xs" />
      </div>

      {/* Step Content */}
      <main className="max-w-2xl w-full mx-auto my-8">
        <Card variant="glass" className="p-6 sm:p-10 border-slate-800 shadow-2xl">
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-white">Let&apos;s start with the basics</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  This calibrates your baseline metabolic rate calculation.
                </p>
              </div>

              <Input
                label="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Date of Birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Biological Gender
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(['male', 'female'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        gender === g
                          ? 'border-emerald-500 bg-emerald-500/15 text-white font-bold shadow-lg shadow-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="capitalize text-sm">{g}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Body Measurements */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-white">Body Measurements</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  We use these for Mifflin-St Jeor metabolic expenditure modeling.
                </p>
              </div>

              {/* Height */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Height
                  </label>
                  <span className="text-base font-bold text-emerald-400">{heightCm} cm</span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="220"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Current Weight
                  </label>
                  <span className="text-base font-bold text-emerald-400">{weightKg} kg</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Target Weight */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Target Goal Weight
                  </label>
                  <span className="text-base font-bold text-teal-400">{targetWeightKg} kg</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  step="0.5"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              {/* BMI Live Preview */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Current Calculated BMI</div>
                  <div className="text-xl font-bold text-white mt-0.5">{calculated.bmi}</div>
                </div>
                <Badge variant={calculated.bmiCategory === 'Normal weight' ? 'emerald' : 'amber'}>
                  {calculated.bmiCategory}
                </Badge>
              </div>
            </div>
          )}

          {/* STEP 3: Activity Level */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-white">Daily Physical Activity</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  How active are you on an average weekly schedule?
                </p>
              </div>

              <div className="space-y-3">
                {(Object.keys(ACTIVITY_LEVEL_DETAILS) as ActivityLevel[]).map((levelKey) => {
                  const item = ACTIVITY_LEVEL_DETAILS[levelKey];
                  const isSelected = activityLevel === levelKey;

                  return (
                    <div
                      key={levelKey}
                      onClick={() => setActivityLevel(levelKey)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{item.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Goal Selection */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-white">What is your primary focus?</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  NutriLens customizes your daily caloric deficit or surplus accordingly.
                </p>
              </div>

              <div className="space-y-4">
                {(Object.keys(GOAL_OPTIONS) as GoalType[]).map((goalKey) => {
                  const opt = GOAL_OPTIONS[goalKey];
                  const isSelected = goal === goalKey;

                  return (
                    <div
                      key={goalKey}
                      onClick={() => setGoal(goalKey)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 shadow-xl shadow-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-base font-bold text-white">{opt.label}</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 mt-1">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Preferences & Final Calculated Prescription */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-white">Dietary Protocol & AI Target Plan</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Select preferences to tailor your meal recognition recommendations.
                </p>
              </div>

              {/* Multi-select chips */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select Applicable Preferences
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_PREFERENCES_LIST.map((pref) => {
                    const active = selectedDietPrefs.includes(pref);
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

              {/* Calculated Results Summary Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Your Precision Daily Target
                    </span>
                  </div>
                  <Badge variant="emerald">Mifflin-St Jeor Calibrated</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Calories</div>
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
                    <div className="text-[10px] text-slate-400 font-medium">high-density</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-amber-400 font-semibold uppercase">Carbs</div>
                    <div className="text-xl font-black text-amber-300 mt-0.5">
                      {calculated.targetCarbsG}g
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">clean energy</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-rose-400 font-semibold uppercase">Fats</div>
                    <div className="text-xl font-black text-rose-300 mt-0.5">
                      {calculated.targetFatG}g
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">healthy lipids</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    BMR: {calculated.bmr} kcal | TDEE: {calculated.tdee} kcal | Water: {calculated.targetWaterMl}ml
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-800">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="button"
              variant="glow"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {step === totalSteps ? 'Complete & Enter Dashboard' : 'Next Step'}
            </Button>
          </div>
        </Card>
      </main>

      {/* Footer info */}
      <div className="max-w-2xl w-full mx-auto text-center text-xs text-slate-500">
        You can fine-tune or recalculate these parameters anytime in your Health Profile.
      </div>
    </div>
  );
}

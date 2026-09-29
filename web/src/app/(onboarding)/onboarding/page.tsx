'use client';

import React, { useEffect, useState } from 'react';
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
  AlertTriangle,
  HeartPulse,
  Clock,
  Shield,
  Coffee,
  Moon,
  DollarSign,
  Droplets,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { useUserStore } from '../../../lib/stores/user-store';
import { useAuthStore } from '../../../lib/stores/auth-store';
import {
  Gender,
  GoalType,
  WeightLossPace,
  ActivityLevel,
  HealthCondition,
  FoodPreferenceType,
  AllergyType,
  LifestyleProfile,
  PersonalizedDietPlan,
} from '../../../lib/types';
import { cmToFeetInches, feetInchesToCm } from '../../../lib/utils/format';
import { generatePersonalizedDietRecommendation } from '../../../services/diet-recommender';
import { PersonalizedDietPlanView } from '../../../components/diets/PersonalizedDietPlanView';

const GOAL_OPTIONS_LIST: { id: GoalType; title: string; desc: string; icon: string }[] = [
  { id: 'lose_weight', title: 'Lose Weight', desc: 'Sustainable caloric deficit prioritizing fat loss', icon: 'Flame' },
  { id: 'reduce_belly_fat', title: 'Reduce Waist / Belly Fat', desc: 'Target visceral fat with high soluble fiber & low-GI carbs', icon: 'Target' },
  { id: 'gain_muscle', title: 'Build Muscle', desc: 'Controlled caloric surplus with high bioavailable protein', icon: 'Activity' },
  { id: 'body_recomposition', title: 'Body Recomposition', desc: 'Build lean muscle while burning fat simultaneously', icon: 'Scale' },
  { id: 'maintain', title: 'Maintain Weight', desc: 'Equilibrium calories for metabolic stability & energy', icon: 'CheckCircle2' },
  { id: 'general_health', title: 'Improve General Health', desc: 'Focus on longevity, gut diversity, and vibrant energy', icon: 'Sparkles' },
  { id: 'blood_sugar', title: 'Blood Sugar Management', desc: 'Slow-release complex carbs to minimize insulin spikes', icon: 'HeartPulse' },
  { id: 'blood_pressure', title: 'Blood Pressure Support', desc: 'Potassium-rich, magnesium-dense, low-sodium protocol', icon: 'Shield' },
];

const ACTIVITY_OPTIONS: { id: ActivityLevel; title: string; desc: string }[] = [
  { id: 'sedentary', title: 'Sedentary', desc: 'Little to no exercise, desk job, <4,000 steps/day' },
  { id: 'lightly_active', title: 'Lightly Active', desc: 'Light workouts or recreational walks 1–3 days/week' },
  { id: 'moderately_active', title: 'Moderately Active', desc: 'Moderate gym/sports/running 3–5 days/week' },
  { id: 'very_active', title: 'Very Active', desc: 'Hard physical training or sports 6–7 days/week' },
  { id: 'extra_active', title: 'Athlete / Heavy Training', desc: 'Intensive physical training or demanding manual labor' },
];

const HEALTH_CONDITIONS_LIST: { id: HealthCondition; label: string; requiresDoctorFlag?: boolean }[] = [
  { id: 'none', label: 'None / Good General Health' },
  { id: 'diabetes', label: 'Type 2 Diabetes', requiresDoctorFlag: true },
  { id: 'prediabetes', label: 'Prediabetes / Insulin Resistance' },
  { id: 'hypertension', label: 'High Blood Pressure' },
  { id: 'pcos', label: 'PCOS (Polycystic Ovary Syndrome)' },
  { id: 'thyroid', label: 'Thyroid Condition' },
  { id: 'high_cholesterol', label: 'High Cholesterol / Lipids' },
  { id: 'fatty_liver', label: 'Fatty Liver' },
  { id: 'kidney_disease', label: 'Kidney Disease / Renal Impairment', requiresDoctorFlag: true },
  { id: 'liver_disease', label: 'Liver Condition', requiresDoctorFlag: true },
  { id: 'gerd', label: 'Gastric / Acid Reflux (GERD)' },
  { id: 'ibs', label: 'IBS / Digestive Sensitivity' },
  { id: 'anemia', label: 'Iron Deficiency / Anemia' },
  { id: 'pregnancy_breastfeeding', label: 'Pregnancy / Breastfeeding', requiresDoctorFlag: true },
  { id: 'other', label: 'Other Health Concern' },
];

const FOOD_PREFERENCES_LIST: { id: FoodPreferenceType; label: string; desc: string }[] = [
  { id: 'traditional_bangladeshi', label: 'Traditional Bangladeshi', desc: 'Rice, local fish, lentils (Dal), chicken, and seasonal greens' },
  { id: 'balanced', label: 'Balanced Omnivore', desc: 'Variety of lean meats, whole grains, vegetables, and fruits' },
  { id: 'high_protein', label: 'High Protein', desc: 'Higher protein density for gym performance and satiety' },
  { id: 'low_carb', label: 'Low Carb / Carb Conscious', desc: 'Reduced carbohydrates with focus on proteins and healthy fats' },
  { id: 'pescatarian', label: 'Pescatarian', desc: 'Fish, seafood, dairy, and plant-based foods (no poultry/red meat)' },
  { id: 'vegetarian', label: 'Vegetarian', desc: 'Dairy, eggs, legumes, grains, and vegetables (no meat/fish)' },
  { id: 'vegan', label: '100% Plant-Based / Vegan', desc: 'Exclusively botanical foods (no animal products, dairy, or eggs)' },
  { id: 'flexible', label: 'Flexible', desc: 'Open to varied healthy cooking styles and recipes' },
];

const COMMON_FOODS_LIST = [
  'White Rice',
  'Brown / Red Rice',
  'Atta Roti',
  'Lentils (Masoor / Moong Dal)',
  'Rui / Katla Fish',
  'Ilish Fish',
  'Chicken Breast / Desi Chicken',
  'Lean Beef',
  'Whole Eggs / Boiled Eggs',
  'Cow Milk',
  'Plain Curd / Tok Doi',
  'Lal Shak / Palong Shak',
  'Lau / Potol / Korola',
  'Cucumber & Tomato Salad',
  'Guava / Papaya',
  'Oats',
  'Chickpeas (Chola)',
  'Peanuts / Almonds',
];

const ALLERGY_OPTIONS: { id: AllergyType; label: string }[] = [
  { id: 'none', label: 'No Allergies / Intolerances' },
  { id: 'dairy', label: 'Milk / Dairy (Lactose)' },
  { id: 'egg', label: 'Eggs' },
  { id: 'fish', label: 'Fish (River / Marine)' },
  { id: 'seafood', label: 'Shellfish / Shrimp / Prawn' },
  { id: 'peanut', label: 'Peanuts' },
  { id: 'treenut', label: 'Tree Nuts (Almonds, Walnuts)' },
  { id: 'gluten', label: 'Gluten / Wheat' },
  { id: 'soy', label: 'Soy / Tofu' },
  { id: 'other', label: 'Other Intolerance' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile, setGoalType, recalculateTargets } = useUserStore();
  const { user: authUser, setUser, checkAuth } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;
    if (!window.localStorage.getItem('nutrilens_token')) {
      router.replace('/register');
      return;
    }
    checkAuth().then((user) => {
      if (!active) return;
      if (!user) router.replace('/register');
      else setIsCheckingAuth(false);
    });
    return () => { active = false; };
  }, [checkAuth, router]);

  const [step, setStep] = useState(1);
  const totalSteps = 8;

  // Step 1: Basic Profile
  const [name, setName] = useState(authUser?.name || profile.name || 'Alex Morgan');
  const [dob, setDob] = useState(authUser?.dob || profile.dob || '1998-05-14');
  const [gender, setGender] = useState<Gender>(authUser?.gender || profile.gender || 'male');
  const [heightCm, setHeightCm] = useState<number>(authUser?.heightCm || profile.heightCm || 172);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightKg, setWeightKg] = useState<number>(authUser?.weightKg || profile.weightKg || 78.0);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(authUser?.targetWeightKg || profile.targetWeightKg || 68.0);
  const [waistInches, setWaistInches] = useState<string>('34');

  // Step 2: Goal & Pace
  const [primaryGoal, setPrimaryGoal] = useState<GoalType>('lose_weight');
  const [goalPace, setGoalPace] = useState<WeightLossPace>('moderate');

  // Step 3: Activity Level
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel || 'moderately_active');

  // Step 4: Health Conditions
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>(['none']);

  // Step 5: Food Preferences
  const [foodPreferences, setFoodPreferences] = useState<FoodPreferenceType[]>(['traditional_bangladeshi', 'balanced']);
  const [commonFoods, setCommonFoods] = useState<string[]>([
    'White Rice',
    'Atta Roti',
    'Lentils (Masoor / Moong Dal)',
    'Rui / Katla Fish',
    'Chicken Breast / Desi Chicken',
    'Whole Eggs / Boiled Eggs',
    'Lal Shak / Palong Shak',
    'Cucumber & Tomato Salad',
  ]);

  // Step 6: Allergies (Hard Exclusions)
  const [allergies, setAllergies] = useState<AllergyType[]>(['none']);

  // Step 7: Lifestyle
  const [sleepHours, setSleepHours] = useState<LifestyleProfile['sleepHours']>('6_to_8');
  const [workType, setWorkType] = useState<LifestyleProfile['workType']>('desk_job');
  const [mealFrequency, setMealFrequency] = useState<LifestyleProfile['mealFrequency']>(3);
  const [cookingHabit, setCookingHabit] = useState<LifestyleProfile['cookingHabit']>('family_cooks');
  const [budgetLevel, setBudgetLevel] = useState<LifestyleProfile['budgetLevel']>('medium');

  // Step 8: Generated Plan State
  const [generatedPlan, setGeneratedPlan] = useState<PersonalizedDietPlan | null>(null);
  const [saveError, setSaveError] = useState('');

  // Toggle Health Condition
  const toggleCondition = (cond: HealthCondition) => {
    if (cond === 'none') {
      setHealthConditions(['none']);
      return;
    }
    const filtered = healthConditions.filter((c) => c !== 'none');
    if (filtered.includes(cond)) {
      const remaining = filtered.filter((c) => c !== cond);
      setHealthConditions(remaining.length === 0 ? ['none'] : remaining);
    } else {
      setHealthConditions([...filtered, cond]);
    }
  };

  // Toggle Food Preference
  const toggleFoodPreference = (pref: FoodPreferenceType) => {
    if (foodPreferences.includes(pref)) {
      if (foodPreferences.length > 1) {
        setFoodPreferences(foodPreferences.filter((p) => p !== pref));
      }
    } else {
      setFoodPreferences([...foodPreferences, pref]);
    }
  };

  // Toggle Common Food
  const toggleCommonFood = (food: string) => {
    if (commonFoods.includes(food)) {
      setCommonFoods(commonFoods.filter((f) => f !== food));
    } else {
      setCommonFoods([...commonFoods, food]);
    }
  };

  // Toggle Allergy
  const toggleAllergy = (all: AllergyType) => {
    if (all === 'none') {
      setAllergies(['none']);
      return;
    }
    const filtered = allergies.filter((a) => a !== 'none');
    if (filtered.includes(all)) {
      const remaining = filtered.filter((a) => a !== all);
      setAllergies(remaining.length === 0 ? ['none'] : remaining);
    } else {
      setAllergies([...filtered, all]);
    }
  };

  // Generate Plan on Step 8
  const handleGeneratePlan = async () => {
    setSaveError('');
    const userPayload = {
      name,
      dob,
      gender,
      heightCm,
      weightKg,
      targetWeightKg,
      waistCm: waistInches ? parseFloat(waistInches) * 2.54 : undefined,
      activityLevel,
      primaryGoal,
      goalPace,
      healthConditions: healthConditions.filter((c) => c !== 'none'),
      foodPreferences,
      commonFoodsEaten: commonFoods,
      allergies: allergies.filter((a) => a !== 'none'),
      lifestyle: {
        sleepHours,
        workType,
        mealFrequency,
        cookingHabit,
        budgetLevel,
      },
      dietaryPreferences: foodPreferences,
    };

    // 1. Generate client-side recommendation instantly
    const plan = generatePersonalizedDietRecommendation(userPayload);
    setGeneratedPlan(plan);

    // 2. Persist to User Store & Server
    try {
      await updateProfile({
        name,
        dob,
        gender,
        heightCm,
        weightKg,
        targetWeightKg,
        waistCm: userPayload.waistCm,
        activityLevel,
        primaryGoal,
        goalPace,
        healthConditions: userPayload.healthConditions,
        foodPreferences,
        commonFoodsEaten: commonFoods,
        allergies: userPayload.allergies,
        lifestyle: userPayload.lifestyle,
        dietaryPreferences: [plan.selectedDiet.name],
        personalizedPlan: plan,
        onboardingCompleted: true,
      });
      await setGoalType(primaryGoal);
      await recalculateTargets();
      if (authUser) setUser({ ...authUser, ...userPayload, personalizedPlan: plan, onboardingCompleted: true });
      router.replace('/profile');
    } catch (err) {
      console.error('Could not save onboarding assessment:', err);
      setSaveError('We could not save your assessment. Please check your connection and try again.');
    }
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else if (step === totalSteps - 1) {
      setStep(step + 1);
      await handleGeneratePlan();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const weightDiff = Math.round((weightKg - targetWeightKg) * 10) / 10;

  if (isCheckingAuth) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Multi-Step Progress Indicator */}
      <div className="max-w-3xl w-full mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-black tracking-tight text-white text-lg">NutriLens</span>
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Step <span className="text-emerald-400 font-bold">{step}</span> of {totalSteps}
          </div>
        </div>

        {/* 8-Step Visual Number Indicator */}
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;
            return (
              <div key={stepNum} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
              </div>
            );
          })}
        </div>

        <ProgressBar progress={(step / totalSteps) * 100} size="sm" variant="emerald" />
      </div>

      {/* Main Multi-Step Form Container */}
      <div className="max-w-3xl w-full mx-auto my-8">
        {/* ==================== STEP 1: ABOUT YOU ==================== */}
        {step === 1 && (
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" /> Step 1 — Basic Profile
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Tell us about yourself</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Your biometrics help us calculate your BMR and baseline energy needs accurately.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
              />

              <Input
                label="Date of Birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>

            {/* Gender Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Biological Sex (for BMR formula)</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'male', label: 'Male' },
                  { id: 'female', label: 'Female' },
                  { id: 'other', label: 'Other' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGender(item.id as Gender)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      gender === item.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Height & Weight Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Height</label>
                  <button
                    type="button"
                    onClick={() => setHeightUnit(heightUnit === 'cm' ? 'ft' : 'cm')}
                    className="text-[10px] text-emerald-400 font-bold hover:underline"
                  >
                    Switch to {heightUnit === 'cm' ? 'ft / in' : 'cm'}
                  </button>
                </div>
                {heightUnit === 'cm' ? (
                  <Input
                    type="number"
                    value={heightCm.toString()}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 170)}
                    placeholder="170"
                    suffix="cm"
                    required
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={cmToFeetInches(heightCm).feet.toString()}
                      onChange={(e) => {
                        const ft = parseInt(e.target.value, 10) || 0;
                        const inVal = cmToFeetInches(heightCm).inches;
                        setHeightCm(feetInchesToCm(ft, inVal));
                      }}
                      placeholder="5"
                      suffix="ft"
                    />
                    <Input
                      type="number"
                      value={cmToFeetInches(heightCm).inches.toString()}
                      onChange={(e) => {
                        const ft = cmToFeetInches(heightCm).feet;
                        const inVal = parseInt(e.target.value, 10) || 0;
                        setHeightCm(feetInchesToCm(ft, inVal));
                      }}
                      placeholder="8"
                      suffix="in"
                    />
                  </div>
                )}
              </div>

              <Input
                label="Current Weight"
                type="number"
                step="0.5"
                value={weightKg.toString()}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 70)}
                placeholder="78"
                suffix="kg"
                required
              />

              <Input
                label="Target Weight"
                type="number"
                step="0.5"
                value={targetWeightKg.toString()}
                onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 70)}
                placeholder="68"
                suffix="kg"
                required
              />
            </div>

            {/* Optional Waist Circumference */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-400" /> Optional: Waist Circumference
                </label>
                <span className="text-[11px] text-slate-500">Helps refine visceral fat estimation</span>
              </div>
              <Input
                type="number"
                value={waistInches}
                onChange={(e) => setWaistInches(e.target.value)}
                placeholder="e.g. 34"
                suffix="inches"
              />
            </div>
          </Card>
        )}

        {/* ==================== STEP 2: PRIMARY GOAL & PACE ==================== */}
        {step === 2 && (
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" /> Step 2 — Primary Goal & Pace
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">What is your primary focus?</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {weightDiff > 0
                  ? `Goal: Shed ~${weightDiff} kg sustainably with metabolic preservation.`
                  : weightDiff < 0
                  ? `Goal: Gain ~${Math.abs(weightDiff)} kg with lean muscle building.`
                  : 'Goal: Optimize health and maintain your current weight.'}
              </p>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOAL_OPTIONS_LIST.map((g) => {
                const isSelected = primaryGoal === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setPrimaryGoal(g.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{g.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Pace Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Preferred Pacing Strategy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'slow_sustainable', title: 'Slow & Sustainable', desc: 'Mild deficit (~0.25 - 0.5 kg/wk). High energy and easiest adherence.' },
                  { id: 'moderate', title: 'Moderate & Balanced', desc: 'Standard deficit (~0.5 kg/wk). Recommended for most users.' },
                  { id: 'faster', title: 'Moderate-Fast', desc: 'Structured deficit (~0.75 kg/wk). Safe if no medical contraindications.' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setGoalPace(p.id as WeightLossPace)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      goalPace === p.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{p.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ==================== STEP 3: ACTIVITY LEVEL ==================== */}
        {step === 3 && (
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" /> Step 3 — Physical Activity Level
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">How active is your daily lifestyle?</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Activity level determines your Total Daily Energy Expenditure (TDEE).
              </p>
            </div>

            <div className="space-y-3">
              {ACTIVITY_OPTIONS.map((act) => {
                const isSelected = activityLevel === act.id;
                return (
                  <div
                    key={act.id}
                    onClick={() => setActivityLevel(act.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{act.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{act.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-3" />}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ==================== STEP 4: HEALTH CONDITIONS & SAFETY ==================== */}
        {step === 4 && (
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <HeartPulse className="w-3.5 h-3.5" /> Step 4 — Health & Medical Considerations
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Do you have any health conditions?</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Select all that apply. Our clinical algorithm prioritizes your safety and filters out contraindicated protocols.
              </p>
            </div>

            {/* Medical Disclaimer Alert */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Clinical Safety Notice:</span> NutriLens does not diagnose or treat medical conditions. If you have kidney disease, are pregnant, or take diabetes medications, always review diet plans with your physician.
              </div>
            </div>

            {/* Checkboxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HEALTH_CONDITIONS_LIST.map((cond) => {
                const isSelected = healthConditions.includes(cond.id);
                return (
                  <div
                    key={cond.id}
                    onClick={() => toggleCondition(cond.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">{cond.label}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ==================== STEP 5: FOOD PREFERENCES ==================== */}
        {step === 5 && (
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Utensils className="w-3.5 h-3.5" /> Step 5 — Food Preferences
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">What eating style do you prefer?</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                We specialize in adapting plans to traditional Bangladeshi staples and household portions.
              </p>
            </div>

            {/* Diet Types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FOOD_PREFERENCES_LIST.map((pref) => {
                const isSelected = foodPreferences.includes(pref.id);
                return (
                  <div
                    key={pref.id}
                    onClick={() => toggleFoodPreference(pref.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-white">{pref.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{pref.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Common Foods Checklist */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Which foods do you normally eat? (Select staples)
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_FOODS_LIST.map((food) => {
                  const isSelected = commonFoods.includes(food);
                  return (
                    <button
                      key={food}
                      type="button"
                      onClick={() => toggleCommonFood(food)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {food}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* ==================== STEP 6: ALLERGIES (HARD EXCLUSIONS) ==================== */}
        {step === 6 && (
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" /> Step 6 — Food Allergies & Intolerances
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Any food allergies to exclude?</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                All selected items are treated as <span className="text-emerald-400 font-bold">HARD EXCLUSIONS</span> and will never appear in your meal plan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALLERGY_OPTIONS.map((all) => {
                const isSelected = allergies.includes(all.id);
                return (
                  <div
                    key={all.id}
                    onClick={() => toggleAllergy(all.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">{all.label}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ==================== STEP 7: LIFESTYLE & HABITS ==================== */}
        {step === 7 && (
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Step 7 — Lifestyle & Daily Routine
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">How is your daily schedule?</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Meal frequency and cooking habits ensure your plan fits your actual day-to-day life.
              </p>
            </div>

            {/* Meal Frequency */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Preferred Daily Meal Frequency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { count: 2, label: '2 Meals', sub: 'Intermittent' },
                  { count: 3, label: '3 Meals', sub: 'Traditional' },
                  { count: 4, label: '4 Meals', sub: '+ 1 Snack' },
                  { count: 5, label: '5 Meals', sub: '+ 2 Snacks' },
                ].map((m) => (
                  <button
                    key={m.count}
                    type="button"
                    onClick={() => setMealFrequency(m.count as any)}
                    className={`py-3 px-2 rounded-xl text-center border transition-all ${
                      mealFrequency === m.count
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs sm:text-sm">{m.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{m.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep & Work */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-blue-400" /> Sleep Duration
                </label>
                <select
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="less_than_5">Less than 5 hours</option>
                  <option value="5_to_6">5 – 6 hours</option>
                  <option value="6_to_8">6 – 8 hours (Optimal)</option>
                  <option value="8_plus">8+ hours</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" /> Work Type
                </label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="desk_job">Desk Job / Seated</option>
                  <option value="mixed">Mixed Movement & Standing</option>
                  <option value="physical_labor">Physical Labor / On Feet</option>
                </select>
              </div>
            </div>

            {/* Cooking & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-400" /> Cooking Arrangement
                </label>
                <select
                  value={cookingHabit}
                  onChange={(e) => setCookingHabit(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="self_cook">I cook myself</option>
                  <option value="family_cooks">Family / household cooks</option>
                  <option value="mostly_takeaway">Mostly restaurant / takeaway</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Grocery Budget Focus
                </label>
                <select
                  value={budgetLevel}
                  onChange={(e) => setBudgetLevel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="low">Budget-Friendly (Local seasonal staples)</option>
                  <option value="medium">Medium / Standard</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* ==================== STEP 8: RESULT PAGE ==================== */}
        {step === 8 && (
          <div>
            {saveError && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                <p className="text-sm text-rose-300">{saveError}</p>
                <Button variant="outline" onClick={handleGeneratePlan}>
                  Retry Save
                </Button>
              </div>
            )}
            {generatedPlan ? (
              <PersonalizedDietPlanView
                plan={generatedPlan}
                onPlanUpdate={(updated) => setGeneratedPlan(updated)}
                onRetakeAssessment={() => setStep(1)}
              />
            ) : (
              <Card variant="glass" className="p-12 text-center border-slate-800 space-y-4">
                <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-lg font-bold text-white">Generating Your Personalized Plan...</h3>
                <p className="text-xs text-slate-400">
                  Calibrating macro distributions, ranking diet protocols, and structuring your 7-day meal plan.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Bottom Navigation Controls (Steps 1 - 7) */}
        {step < totalSteps && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            <Button
              variant="glow"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 shadow-lg shadow-emerald-500/20"
            >
              {step === totalSteps - 1 ? (
                <>
                  <Sparkles className="w-4 h-4" /> Generate My Plan
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 py-4 max-w-xl mx-auto">
        NutriLens Nutrition Engine • Calibrated with USDA & Clinical Health Guidelines • Data stays private & secure.
      </div>
    </div>
  );
}

const crypto = require('crypto');
const User = require('../models/User');
const Meal = require('../models/Meal');
const FoodScan = require('../models/FoodScan');
const WeightLog = require('../models/WeightLog');
const PlannedMeal = require('../models/PlannedMeal');
const { encodePassword, passwordMatches } = require('../utils/password');
const { generatePersonalizedDietRecommendation } = require('./diet-recommendation-engine');

// Demo accounts are on unless DEMO_MODE=false, so a fresh deployment's live demo works out of the box.
const isDemoModeEnabled = () => process.env.DEMO_MODE !== 'false';

// Shown on the login page — keep in sync with web/src/lib/constants (DEMO_LOGINS).
const DEMO_ACCOUNTS = [
  {
    role: 'user',
    email: 'demo.member@nutrilens.app',
    password: 'Demo@1234',
    profile: {
      name: 'Ayesha Rahman',
      gender: 'female',
      dob: '1994-08-12',
      heightCm: 160,
      weightKg: 68.4,
      targetWeightKg: 60,
      waistCm: 86,
      activityLevel: 'lightly_active',
      primaryGoal: 'lose_weight',
      goalPace: 'moderate',
      healthConditions: ['pcos'],
      foodPreferences: ['traditional_bangladeshi', 'balanced'],
      commonFoodsEaten: ['White Rice', 'Atta Roti', 'Lentils (Masoor / Moong Dal)', 'Rui / Katla Fish', 'Whole Eggs / Boiled Eggs', 'Lal Shak / Palong Shak'],
      allergies: [],
      lifestyle: { sleepHours: '6_to_8', workType: 'desk_job', mealFrequency: 4, cookingHabit: 'family_cooks', budgetLevel: 'medium' },
    },
  },
  {
    role: 'admin',
    email: 'demo.admin@nutrilens.app',
    password: 'Admin@1234',
    profile: {
      name: 'Demo Admin',
      gender: 'male',
      dob: '1990-01-01',
      avatarUrl: '',
      healthConditions: [],
      allergies: [],
    },
  },
];

// Non-login members that give the admin panel realistic data to browse.
const SAMPLE_MEMBERS = [
  { name: 'Nadia Islam', email: 'nadia.islam@example.com', gender: 'female', dob: '1990-02-11', heightCm: 158, weightKg: 72, targetWeightKg: 62, activityLevel: 'sedentary', primaryGoal: 'blood_sugar', healthConditions: ['prediabetes'], foodPreferences: ['traditional_bangladeshi'], joinedDaysAgo: 26 },
  { name: 'Tanvir Hasan', email: 'tanvir.hasan@example.com', gender: 'male', dob: '1988-11-03', heightCm: 175, weightKg: 88, targetWeightKg: 78, activityLevel: 'moderately_active', primaryGoal: 'lose_weight', healthConditions: ['hypertension'], foodPreferences: ['balanced'], joinedDaysAgo: 21 },
  { name: 'Farhana Akter', email: 'farhana.akter@example.com', gender: 'female', dob: '1996-06-25', heightCm: 162, weightKg: 54, targetWeightKg: 54, activityLevel: 'moderately_active', primaryGoal: 'general_health', healthConditions: ['anemia'], foodPreferences: ['traditional_bangladeshi', 'balanced'], joinedDaysAgo: 17 },
  { name: 'Rafiq Chowdhury', email: 'rafiq.chowdhury@example.com', gender: 'male', dob: '1979-01-14', heightCm: 170, weightKg: 81, targetWeightKg: 74, activityLevel: 'lightly_active', primaryGoal: 'blood_pressure', healthConditions: ['hypertension', 'high_cholesterol'], foodPreferences: ['balanced'], joinedDaysAgo: 12 },
  { name: 'Sadia Karim', email: 'sadia.karim@example.com', gender: 'female', dob: '1992-09-30', heightCm: 165, weightKg: 70, targetWeightKg: 63, activityLevel: 'lightly_active', primaryGoal: 'reduce_belly_fat', healthConditions: ['thyroid'], foodPreferences: ['traditional_bangladeshi'], joinedDaysAgo: 8 },
  { name: 'Imran Hossain', email: 'imran.hossain@example.com', gender: 'male', dob: '1998-04-18', heightCm: 180, weightKg: 70, targetWeightKg: 76, activityLevel: 'very_active', primaryGoal: 'gain_muscle', healthConditions: [], foodPreferences: ['high_protein'], joinedDaysAgo: 4 },
  { name: 'Maliha Sultana', email: 'maliha.sultana@example.com', gender: 'female', dob: '2000-12-05', heightCm: 157, weightKg: 49, targetWeightKg: 52, activityLevel: 'lightly_active', primaryGoal: 'general_health', healthConditions: ['ibs'], foodPreferences: ['vegetarian'], joinedDaysAgo: 1, assessmentPending: true },
];

const DEFAULT_LIFESTYLE = { sleepHours: '6_to_8', workType: 'desk_job', mealFrequency: 3, cookingHabit: 'family_cooks', budgetLevel: 'medium' };

const item = (foodName, quantity, unit, calories, protein, carbs, fat, fiber = 0) => ({
  foodName, quantity, unit, calories, protein, carbs, fat, fiber,
});

const photo = (id) => `https://images.unsplash.com/photo-${id}?w=600&auto=format&fit=crop&q=80`;

// Templates with a `photo` were "scanned": the photo shows exactly the listed foods.
const MEAL_TEMPLATES = {
  breakfast: [
    { time: '08:10', items: [item('Lal Atta Roti', 70, 'g', 173, 5.9, 33.6, 1, 4.8), item('Boiled Eggs', 100, 'g', 143, 12.6, 0.7, 9.5), item('Cucumber & Tomato Salad', 80, 'g', 14, 0.6, 3.1, 0.2, 0.9)] },
    { time: '08:25', photo: photo('1525351484163-7529414344d8'), items: [item('Fried Egg', 50, 'g', 90, 6.3, 0.4, 7), item('Whole Wheat Toast', 40, 'g', 100, 4.8, 17, 1.4, 2.8), item('Avocado Spread', 30, 'g', 48, 0.6, 2.6, 4.4, 2)] },
    { time: '07:55', photo: photo('1488477181946-6428a0291777'), items: [item('Greek Yogurt', 170, 'g', 100, 17, 6, 0.7), item('Strawberries', 100, 'g', 32, 0.7, 7.7, 0.3, 2), item('Almonds', 15, 'g', 87, 3.2, 3.2, 7.5, 1.9)] },
    { time: '08:30', items: [item('Rolled Oats Porridge', 50, 'g', 190, 6.7, 33, 3.4, 5), item('Banana', 118, 'g', 105, 1.3, 27, 0.4, 3.1), item('Low-fat Milk', 200, 'ml', 98, 6.8, 10, 2.4)] },
  ],
  lunch: [
    { time: '13:25', items: [item('Brown Rice', 150, 'g', 168, 3.9, 35, 1.4, 2.7), item('Masoor Dal', 150, 'g', 174, 13.5, 30, 0.6, 11.9), item('Rui Fish Curry', 120, 'g', 190, 22, 3, 10), item('Lal Shak Bhaji', 100, 'g', 40, 2.5, 5, 1.5, 2)] },
    { time: '13:10', photo: photo('1546069901-ba9599a7e63c'), items: [item('Grilled Chicken Breast', 120, 'g', 198, 37, 0, 4.3), item('Boiled Egg', 50, 'g', 78, 6.3, 0.6, 5.3), item('Mixed Greens & Red Cabbage', 120, 'g', 30, 1.8, 6, 0.3, 2.5), item('Sweet Corn & Cherry Tomatoes', 80, 'g', 60, 2, 12.5, 0.8, 2)] },
    { time: '13:40', items: [item('Moong Dal Khichuri', 250, 'g', 300, 11, 52, 5, 6), item('Mixed Vegetable Bhaji', 100, 'g', 45, 2, 8, 0.5, 3), item('Egg Omelette', 60, 'g', 94, 6.5, 0.6, 7)] },
  ],
  snack: [
    { time: '16:40', items: [item('Guava', 150, 'g', 102, 3.8, 21, 1.4, 8.1), item('Mixed Nuts', 20, 'g', 120, 4, 4, 10.6, 1.4)] },
    { time: '16:15', items: [item('Roasted Chickpeas', 40, 'g', 150, 7, 20, 4, 6), item('Green Tea', 250, 'ml', 2, 0, 0, 0)] },
    { time: '17:05', items: [item('Apple', 150, 'g', 78, 0.4, 21, 0.3, 3.6), item('Peanut Butter', 16, 'g', 94, 3.6, 3.4, 8, 1)] },
  ],
  dinner: [
    { time: '20:15', items: [item('Chicken Bhuna', 150, 'g', 260, 30, 6, 13, 1), item('Lal Atta Roti', 70, 'g', 173, 5.9, 33.6, 1, 4.8), item('Cucumber & Tomato Salad', 100, 'g', 18, 0.8, 3.9, 0.2, 1.1)] },
    { time: '20:30', items: [item('Steamed Tilapia', 150, 'g', 192, 39, 0, 4), item('White Rice', 120, 'g', 156, 3.2, 34, 0.4, 0.5), item('Palong Shak (Spinach)', 100, 'g', 23, 2.9, 3.6, 0.4, 2.2)] },
    { time: '19:45', photo: photo('1467003909585-2f8a72700288'), items: [item('Pan-seared Salmon', 140, 'g', 291, 28, 0, 19), item('Sautéed Vegetables', 150, 'g', 75, 2.5, 11, 2.5, 4)] },
    { time: '19:50', items: [item('Paneer Tikka', 100, 'g', 265, 18, 3.6, 20), item('Vegetable Stir-fry', 150, 'g', 90, 3, 12, 3.5, 4)] },
  ],
};

const ACTIVITY_DAYS = 14;
const WEIGHT_DAYS = 30;
const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

const round1 = (value) => Math.round(value * 10) / 10;

const toDateString = (date) => date.toISOString().split('T')[0];

const addDays = (dateStr, days) => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
};

// Accept the visitor's local date only when it is within a day of the server's, so it cannot seed far-off dates.
function resolveToday(clientDate) {
  const serverToday = toDateString(new Date());
  if (typeof clientDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) return serverToday;
  const diffDays = Math.abs(new Date(`${clientDate}T00:00:00Z`) - new Date(`${serverToday}T00:00:00Z`)) / 86400000;
  return diffDays <= 1 ? clientDate : serverToday;
}

// Small deterministic hash so generated activity varies by member and day but never changes on refresh.
function seedNumber(...parts) {
  let hash = 2166136261;
  for (const char of parts.join('|')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function buildMeal(userId, type, date, template) {
  const totals = template.items.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
      fiber: acc.fiber + entry.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
  return {
    userId,
    type,
    date,
    time: template.time,
    totalCalories: Math.round(totals.calories),
    totalProtein: round1(totals.protein),
    totalCarbs: round1(totals.carbs),
    totalFat: round1(totals.fat),
    totalFiber: round1(totals.fiber),
    items: template.items.map((entry) => ({ ...entry, confidence: 1 })),
    notes: '',
  };
}

function buildScan(meal, imageUrl, variant) {
  const [hours, minutes] = meal.time.split(':').map(Number);
  const scannedAt = new Date(`${meal.date}T00:00:00Z`);
  scannedAt.setUTCHours(hours, Math.max(0, minutes - 2));
  return {
    userId: meal.userId,
    imageUrl,
    status: 'completed',
    suggestedMealType: meal.type,
    analysisNotes: 'On-device vision match confirmed by the member.',
    totalCalories: meal.totalCalories,
    totalProtein: meal.totalProtein,
    totalCarbs: meal.totalCarbs,
    totalFat: meal.totalFat,
    totalFiber: meal.totalFiber,
    detectedItems: meal.items.map((entry, index) => ({
      name: entry.foodName,
      confidence: Math.round((0.97 - ((variant + index) % 5) * 0.03) * 100) / 100,
      estimatedQuantity: entry.quantity,
      unit: entry.unit,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
    })),
    createdAt: scannedAt,
    updatedAt: scannedAt,
  };
}

function plannedMealsFromPlan(userId, plan) {
  const mapType = (mealType) => (['breakfast', 'lunch', 'dinner'].includes(mealType) ? mealType : 'snack');
  return (plan.sevenDayPlan || []).flatMap((day, dayIndex) =>
    (day.meals || []).map((meal) => {
      const items = meal.items || [];
      const sum = (key) => Math.round(items.reduce((total, entry) => total + (entry[key] || 0), 0));
      return {
        userId,
        dayOfWeek: dayIndex % 7,
        mealType: mapType(meal.mealType),
        foodName: items.slice(0, 2).map((entry) => entry.name).join(' + ') || meal.title,
        calories: sum('calories'),
        protein: sum('protein'),
        carbs: sum('carbs'),
        fat: sum('fat'),
      };
    })
  );
}

function assessmentFields(profile) {
  const lifestyle = profile.lifestyle || DEFAULT_LIFESTYLE;
  const plan = generatePersonalizedDietRecommendation({ ...profile, lifestyle });
  return {
    plan,
    fields: {
      lifestyle,
      personalizedPlan: plan,
      onboardingCompleted: true,
      dietaryPreferences: [plan.selectedDiet.name],
      activeDietId: plan.selectedDiet.slug,
      goal: {
        type: profile.primaryGoal || 'lose_weight',
        targetCalories: plan.summary.targetCalories,
        targetProteinG: plan.summary.targetProteinG,
        targetCarbsG: plan.summary.targetCarbsG,
        targetFatG: plan.summary.targetFatG,
        targetFiberG: plan.summary.targetFiberG,
        targetWaterMl: plan.summary.targetWaterMl,
        weeklyWeightChangeKg: profile.targetWeightKg >= profile.weightKg ? 0.25 : -0.5,
        isActive: true,
      },
    },
  };
}

async function ensureLoginAccount(account) {
  let user = await User.findOne({ email: account.email }).select('+password');

  if (!user) {
    const base = { ...account.profile, email: account.email, role: account.role, isDemo: true, password: encodePassword(account.password) };
    if (account.role === 'user') {
      const { plan, fields } = assessmentFields(account.profile);
      user = await User.create({ ...base, ...fields });
      await PlannedMeal.insertMany(plannedMealsFromPlan(user._id, plan));
    } else {
      user = await User.create({ ...base, onboardingCompleted: true });
    }
    return user;
  }

  // Repair anything a previous version or a visitor may have changed.
  let changed = false;
  if (user.role !== account.role) { user.role = account.role; changed = true; }
  if (!user.isDemo) { user.isDemo = true; changed = true; }
  if (!passwordMatches(account.password, user.password)) { user.password = encodePassword(account.password); changed = true; }
  if (account.role === 'user' && !user.personalizedPlan) {
    const { plan, fields } = assessmentFields({ ...account.profile, ...user.toObject() });
    user.set(fields);
    changed = true;
    if (!(await PlannedMeal.exists({ userId: user._id }))) {
      await PlannedMeal.insertMany(plannedMealsFromPlan(user._id, plan));
    }
  }
  if (!user.onboardingCompleted) { user.onboardingCompleted = true; changed = true; }
  if (changed) await user.save();
  return user;
}

async function ensureSampleMember(member) {
  if (await User.exists({ email: member.email })) return;
  const { joinedDaysAgo, assessmentPending, ...profile } = member;
  const joinedAt = new Date(Date.now() - joinedDaysAgo * 86400000);
  const base = {
    ...profile,
    goalPace: 'moderate',
    allergies: [],
    avatarUrl: '',
    role: 'user',
    isDemo: true,
    // Random, never shown: sample members exist for the admin panel only.
    password: encodePassword(crypto.randomBytes(24).toString('hex')),
    createdAt: joinedAt,
    updatedAt: joinedAt,
  };
  if (assessmentPending) {
    await User.create({ ...base, onboardingCompleted: false });
  } else {
    await User.create({ ...base, ...assessmentFields(profile).fields });
  }
}

/**
 * Tops up meals, AI scans and weight logs for demo members so the dashboards always show
 * the last two weeks of activity. Only dates without data are filled, so it is safe to call
 * on every demo sign-in and never overwrites what a visitor logged.
 */
let activeRefresh = null;

// Concurrent demo sign-ins share one refresh so the same day is never filled twice.
function refreshDemoActivity(clientDate) {
  if (!isDemoModeEnabled()) return Promise.resolve();
  if (!activeRefresh) {
    activeRefresh = topUpDemoActivity(clientDate).finally(() => {
      activeRefresh = null;
    });
  }
  return activeRefresh;
}

async function topUpDemoActivity(clientDate) {
  const today = resolveToday(clientDate);
  const dates = Array.from({ length: ACTIVITY_DAYS }, (_, index) => addDays(today, index - (ACTIVITY_DAYS - 1)));
  const loginEmail = DEMO_ACCOUNTS.find((account) => account.role === 'user').email;

  const members = await User.find({ isDemo: true, role: 'user', onboardingCompleted: true }).select('_id email createdAt');
  for (const member of members) {
    const isLoginMember = member.email === loginEmail;
    const joined = toDateString(member.createdAt || new Date());
    const loggedDates = new Set(await Meal.distinct('date', { userId: member._id, date: { $in: dates } }));

    const meals = [];
    const scans = [];
    for (const date of dates) {
      if (loggedDates.has(date) || (!isLoginMember && date < joined)) continue;
      const roll = seedNumber(member.email, date);
      // Sample members skip roughly one day in four; the login member logs every day.
      if (!isLoginMember && roll % 4 === 0) continue;
      const types = date === today
        ? ['breakfast', 'lunch']
        : MEAL_TYPES.filter((type, index) => isLoginMember || index === 1 || (roll >> (index + 2)) % 3 !== 0);
      types.forEach((type, index) => {
        const templates = MEAL_TEMPLATES[type];
        const template = templates[(roll + index) % templates.length];
        const meal = buildMeal(member._id, type, date, template);
        meals.push(meal);
        if (template.photo) scans.push(buildScan(meal, template.photo, roll + index));
      });
    }
    if (meals.length) await Meal.insertMany(meals);
    if (scans.length) await FoodScan.insertMany(scans);

    if (isLoginMember) await refreshDemoWeights(member._id, today);
  }
}

async function refreshDemoWeights(userId, today) {
  const dates = Array.from({ length: WEIGHT_DAYS }, (_, index) => addDays(today, index - (WEIGHT_DAYS - 1)));
  const logged = new Set(await WeightLog.distinct('date', { userId, date: { $in: dates } }));
  const logs = dates
    .map((date, index) => {
      const daysAgo = WEIGHT_DAYS - 1 - index;
      // ~1.8 kg down over the month with day-to-day water fluctuation, landing on the profile weight today.
      const weightKg = round1(68.4 + daysAgo * 0.062 + Math.sin(seedNumber(date) % 360) * 0.18);
      return { userId, date, weightKg, notes: daysAgo % 7 === 0 ? 'Weekly check-in' : '' };
    })
    .filter((log) => !logged.has(log.date));
  if (logs.length) await WeightLog.insertMany(logs);
}

async function ensureDemoAccounts() {
  if (!isDemoModeEnabled()) return;
  for (const account of DEMO_ACCOUNTS) await ensureLoginAccount(account);
  for (const member of SAMPLE_MEMBERS) await ensureSampleMember(member);
  await refreshDemoActivity();
}

module.exports = {
  DEMO_ACCOUNTS,
  isDemoModeEnabled,
  ensureDemoAccounts,
  refreshDemoActivity,
};

const mongoose = require('mongoose');
const User = require('../models/User');
const Meal = require('../models/Meal');
const FoodScan = require('../models/FoodScan');
const WeightLog = require('../models/WeightLog');
const PlannedMeal = require('../models/PlannedMeal');
const Food = require('../models/Food');
const Vegetable = require('../models/Vegetable');
const LearnedFoodMatch = require('../models/LearnedFoodMatch');
const { CANONICAL_DIETS } = require('../services/nutrition-intelligence');

const ok = (res, data, message = 'Admin data retrieved successfully') =>
  res.status(200).json({ success: true, code: 200, message, data });

const fail = (res, error) =>
  res.status(422).json({
    success: false,
    code: 422,
    errors: [typeof error === 'string' ? error : error.message || 'Admin request failed'],
  });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pageParams = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

const toDateString = (date) => date.toISOString().split('T')[0];

const lastDates = (today, count) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (count - 1 - index));
    return toDateString(date);
  });

// Scan photos may be stored as large base64 data URLs; list views only carry hosted image links.
const hostedImage = {
  $cond: [{ $eq: [{ $substrCP: [{ $ifNull: ['$imageUrl', ''] }, 0, 4] }, 'http'] }, '$imageUrl', null],
};

const scanListStages = [
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      id: '$_id',
      userName: { $ifNull: ['$user.name', 'Deleted member'] },
      userEmail: '$user.email',
      imageUrl: hostedImage,
      mealType: '$suggestedMealType',
      status: 1,
      totalCalories: 1,
      totalProtein: 1,
      totalCarbs: 1,
      totalFat: 1,
      items: {
        $map: { input: '$detectedItems', as: 'item', in: { name: '$$item.name', confidence: '$$item.confidence' } },
      },
      avgConfidence: { $avg: '$detectedItems.confidence' },
      createdAt: 1,
    },
  },
];

const planSummary = (plan) =>
  plan && plan.selectedDiet
    ? {
        dietName: plan.selectedDiet.name,
        targetCalories: plan.summary?.targetCalories,
        bmi: plan.summary?.bmi,
        bmiCategory: plan.summary?.bmiCategory,
        tdee: plan.summary?.tdee,
        requiresDoctorConsult: Boolean(plan.safetyAlerts?.requiresDoctorConsult),
        safetyMessages: plan.safetyAlerts?.messages || [],
      }
    : null;

// @desc    Platform KPIs, 14-day activity and member mix
// @route   GET /api/admin/overview
exports.getOverview = async (req, res) => {
  try {
    const today = /^\d{4}-\d{2}-\d{2}$/.test(req.query.today || '') ? req.query.today : toDateString(new Date());
    const dates = lastDates(today, 14);
    const activityStart = new Date(`${dates[0]}T00:00:00Z`);
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    const [
      members, admins, newMembers7d, onboardedMembers, meals, scans, weightLogs, plannedMeals,
      foods, vegetables, publishedVegetables, learnedMatches,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: weekAgo } }),
      User.countDocuments({ role: 'user', onboardingCompleted: true }),
      Meal.countDocuments(),
      FoodScan.countDocuments(),
      WeightLog.countDocuments(),
      PlannedMeal.countDocuments(),
      Food.countDocuments(),
      Vegetable.countDocuments(),
      Vegetable.countDocuments({ isActive: true }),
      LearnedFoodMatch.countDocuments(),
    ]);

    const [mealsByDay, scansByDay, goals, dietAdoption, conditions, mealTypes, confidence, recentMembers, recentScans] =
      await Promise.all([
        Meal.aggregate([
          { $match: { date: { $in: dates } } },
          { $group: { _id: '$date', meals: { $sum: 1 }, calories: { $sum: '$totalCalories' } } },
        ]),
        FoodScan.aggregate([
          { $match: { createdAt: { $gte: activityStart } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, scans: { $sum: 1 } } },
        ]),
        User.aggregate([
          { $match: { role: 'user' } },
          { $group: { _id: { $ifNull: ['$primaryGoal', 'lose_weight'] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        User.aggregate([
          { $match: { role: 'user', 'personalizedPlan.selectedDiet.name': { $exists: true } } },
          { $group: { _id: '$personalizedPlan.selectedDiet.name', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 6 },
        ]),
        User.aggregate([
          { $match: { role: 'user' } },
          { $unwind: '$healthConditions' },
          { $group: { _id: '$healthConditions', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 8 },
        ]),
        Meal.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 }, avgCalories: { $avg: '$totalCalories' } } },
          { $sort: { count: -1 } },
        ]),
        FoodScan.aggregate([
          { $unwind: '$detectedItems' },
          { $group: { _id: null, avg: { $avg: '$detectedItems.confidence' }, items: { $sum: 1 } } },
        ]),
        User.find({ role: 'user' })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name email primaryGoal onboardingCompleted isDemo createdAt personalizedPlan.selectedDiet.name')
          .lean(),
        FoodScan.aggregate([{ $sort: { createdAt: -1 } }, { $limit: 5 }, ...scanListStages]),
      ]);

    const mealMap = new Map(mealsByDay.map((row) => [row._id, row]));
    const scanMap = new Map(scansByDay.map((row) => [row._id, row.scans]));

    ok(res, {
      totals: {
        members, admins, newMembers7d, onboardedMembers, meals, scans, weightLogs, plannedMeals,
        foods, vegetables, publishedVegetables, learnedMatches, dietProtocols: CANONICAL_DIETS.length,
      },
      activity: dates.map((date) => ({
        date,
        meals: mealMap.get(date)?.meals || 0,
        calories: Math.round(mealMap.get(date)?.calories || 0),
        scans: scanMap.get(date) || 0,
      })),
      goals: goals.map((row) => ({ goal: row._id, count: row.count })),
      dietAdoption: dietAdoption.map((row) => ({ diet: row._id, count: row.count })),
      conditions: conditions.map((row) => ({ condition: row._id, count: row.count })),
      mealTypes: mealTypes.map((row) => ({ type: row._id, count: row.count, avgCalories: Math.round(row.avgCalories || 0) })),
      avgScanConfidence: confidence[0]?.avg ?? null,
      recentMembers: recentMembers.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        primaryGoal: user.primaryGoal,
        onboardingCompleted: Boolean(user.onboardingCompleted),
        isDemo: Boolean(user.isDemo),
        dietName: user.personalizedPlan?.selectedDiet?.name || null,
        createdAt: user.createdAt,
      })),
      recentScans,
    });
  } catch (error) {
    fail(res, error);
  }
};

// @desc    Paginated member directory with activity counts
// @route   GET /api/admin/users
exports.listUsers = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req.query);
    const filter = {};
    if (['user', 'admin'].includes(req.query.role)) filter.role = req.query.role;
    const search = (req.query.search || '').trim();
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: pattern }, { email: pattern }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name email role isDemo primaryGoal healthConditions onboardingCompleted avatarUrl createdAt personalizedPlan.selectedDiet.name personalizedPlan.summary.targetCalories')
        .lean(),
    ]);

    const ids = users.map((user) => user._id);
    const [mealStats, scanStats] = await Promise.all([
      Meal.aggregate([
        { $match: { userId: { $in: ids } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, lastDate: { $max: '$date' } } },
      ]),
      FoodScan.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    ]);
    const mealMap = new Map(mealStats.map((row) => [String(row._id), row]));
    const scanMap = new Map(scanStats.map((row) => [String(row._id), row.count]));

    ok(res, {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        isDemo: Boolean(user.isDemo),
        primaryGoal: user.primaryGoal,
        healthConditions: user.healthConditions || [],
        onboardingCompleted: Boolean(user.onboardingCompleted || user.personalizedPlan),
        avatarUrl: user.avatarUrl || '',
        dietName: user.personalizedPlan?.selectedDiet?.name || null,
        targetCalories: user.personalizedPlan?.summary?.targetCalories || null,
        mealCount: mealMap.get(String(user._id))?.count || 0,
        lastMealDate: mealMap.get(String(user._id))?.lastDate || null,
        scanCount: scanMap.get(String(user._id)) || 0,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    fail(res, error);
  }
};

// @desc    Member profile, plan summary and recent activity
// @route   GET /api/admin/users/:id
exports.getUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 'Member not found');
    const user = await User.findById(req.params.id).lean();
    if (!user) return fail(res, 'Member not found');

    const userId = user._id;
    const [meals, scans, weightLogs, plannedMeals, latestWeight, recentMeals, recentScans] = await Promise.all([
      Meal.countDocuments({ userId }),
      FoodScan.countDocuments({ userId }),
      WeightLog.countDocuments({ userId }),
      PlannedMeal.countDocuments({ userId }),
      WeightLog.findOne({ userId }).sort({ date: -1 }).select('date weightKg').lean(),
      Meal.find({ userId }).sort({ date: -1, time: -1 }).limit(5).select('type date time totalCalories totalProtein items.foodName').lean(),
      FoodScan.aggregate([{ $match: { userId } }, { $sort: { createdAt: -1 } }, { $limit: 4 }, ...scanListStages]),
    ]);

    ok(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        isDemo: Boolean(user.isDemo),
        gender: user.gender,
        dob: user.dob,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        targetWeightKg: user.targetWeightKg,
        activityLevel: user.activityLevel,
        primaryGoal: user.primaryGoal,
        healthConditions: user.healthConditions || [],
        allergies: user.allergies || [],
        foodPreferences: user.foodPreferences || [],
        onboardingCompleted: Boolean(user.onboardingCompleted || user.personalizedPlan),
        goal: user.goal || null,
        plan: planSummary(user.personalizedPlan),
        createdAt: user.createdAt,
      },
      stats: { meals, scans, weightLogs, plannedMeals, latestWeight },
      recentMeals: recentMeals.map((meal) => ({
        id: meal._id,
        type: meal.type,
        date: meal.date,
        time: meal.time,
        totalCalories: meal.totalCalories,
        totalProtein: meal.totalProtein,
        foods: (meal.items || []).map((entry) => entry.foodName),
      })),
      recentScans,
    });
  } catch (error) {
    fail(res, error);
  }
};

async function findManageableUser(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 'Member not found');
    return null;
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    fail(res, 'Member not found');
    return null;
  }
  if (String(user._id) === String(req.user._id)) {
    fail(res, 'You cannot change or delete your own admin account');
    return null;
  }
  if (user.isDemo) {
    fail(res, 'Demo accounts are managed automatically and cannot be changed');
    return null;
  }
  return user;
}

// @desc    Promote or demote a member
// @route   PATCH /api/admin/users/:id
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return fail(res, 'Role must be either "user" or "admin"');
    const user = await findManageableUser(req, res);
    if (!user) return;
    user.role = role;
    await user.save();
    ok(res, { id: user._id, role: user.role }, `Role updated to ${role}`);
  } catch (error) {
    fail(res, error);
  }
};

// @desc    Delete a member and all of their logged data
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await findManageableUser(req, res);
    if (!user) return;
    const userId = user._id;
    await Promise.all([
      Meal.deleteMany({ userId }),
      FoodScan.deleteMany({ userId }),
      WeightLog.deleteMany({ userId }),
      PlannedMeal.deleteMany({ userId }),
    ]);
    await user.deleteOne();
    ok(res, { id: userId }, 'Member and their data deleted');
  } catch (error) {
    fail(res, error);
  }
};

// @desc    AI scan activity across all members plus visual-memory corrections
// @route   GET /api/admin/scans
exports.listScans = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req.query, 12);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const [total, scansLast7d, confidence, scans, learned] = await Promise.all([
      FoodScan.countDocuments(),
      FoodScan.countDocuments({ createdAt: { $gte: weekAgo } }),
      FoodScan.aggregate([
        { $unwind: '$detectedItems' },
        {
          $group: {
            _id: null,
            avg: { $avg: '$detectedItems.confidence' },
            items: { $sum: 1 },
            lowConfidence: { $sum: { $cond: [{ $lt: ['$detectedItems.confidence', 0.7] }, 1, 0] } },
          },
        },
      ]),
      FoodScan.aggregate([{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }, ...scanListStages]),
      LearnedFoodMatch.find().sort({ learnedCount: -1, updatedAt: -1 }).limit(8).select('foodName category learnedCount confidenceScore updatedAt').lean(),
    ]);

    ok(res, {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total,
        last7d: scansLast7d,
        detectedItems: confidence[0]?.items || 0,
        avgConfidence: confidence[0]?.avg ?? null,
        lowConfidenceItems: confidence[0]?.lowConfidence || 0,
        learnedMatches: await LearnedFoodMatch.countDocuments(),
      },
      scans,
      learned: learned.map((match) => ({
        id: match._id,
        foodName: match.foodName,
        category: match.category,
        learnedCount: match.learnedCount,
        confidenceScore: match.confidenceScore,
        updatedAt: match.updatedAt,
      })),
    });
  } catch (error) {
    fail(res, error);
  }
};

// @desc    Canonical diet protocol catalogue with member adoption
// @route   GET /api/admin/diets
exports.listDiets = async (req, res) => {
  try {
    const adoption = await User.aggregate([
      { $match: { role: 'user', 'personalizedPlan.selectedDiet.name': { $exists: true } } },
      { $group: { _id: '$personalizedPlan.selectedDiet.name', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);

    ok(res, {
      protocols: CANONICAL_DIETS.map((diet) => ({
        id: diet.id,
        slug: diet.slug,
        name: diet.name,
        tagline: diet.tagline,
        category: diet.category,
        status: diet.status,
        difficulty: diet.difficulty,
        evidenceLevel: diet.evidence_profile?.evidence_level || 'moderate',
        suitableConditions: diet.clinical_profile?.suitable_conditions || [],
        requiresProfessionalReview: diet.clinical_profile?.requires_professional_review || [],
        medicalReviewRequired: Boolean(diet.safety?.medical_review_required),
        macros: {
          protein: diet.macroRatio?.protein_percent || null,
          carbs: diet.macroRatio?.carbohydrate_percent || null,
          fat: diet.macroRatio?.fat_percent || null,
        },
      })),
      adoption: adoption.map((row) => ({ diet: row._id, count: row.count })),
    });
  } catch (error) {
    fail(res, error);
  }
};

// @desc    Food and vegetable nutrition catalogue
// @route   GET /api/admin/catalog?type=vegetables|foods
exports.listCatalog = async (req, res) => {
  try {
    const type = req.query.type === 'foods' ? 'foods' : 'vegetables';
    const Model = type === 'foods' ? Food : Vegetable;
    const { page, limit, skip } = pageParams(req.query, 12);
    const filter = {};
    const search = (req.query.search || '').trim();
    if (search) filter.name = new RegExp(escapeRegex(search), 'i');
    if (req.query.category) filter.category = req.query.category;

    const fields = type === 'foods'
      ? 'name category servingSize servingUnit nutrition tags'
      : 'name category caloriesPer100g proteinPer100g carbsPer100g fatPer100g fiberPer100g source isActive imageUrl';

    const [total, items, categories] = await Promise.all([
      Model.countDocuments(filter),
      Model.find(filter).sort({ name: 1 }).skip(skip).limit(limit).select(fields).lean(),
      Model.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);

    ok(res, {
      type,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      categories: categories.map((row) => ({ name: row._id, count: row.count })),
      items: items.map((entry) =>
        type === 'foods'
          ? {
              id: entry._id,
              name: entry.name,
              category: entry.category,
              serving: `${entry.servingSize} ${entry.servingUnit}`,
              calories: entry.nutrition?.calories ?? 0,
              protein: entry.nutrition?.protein ?? 0,
              carbs: entry.nutrition?.carbs ?? 0,
              fat: entry.nutrition?.fat ?? 0,
              fiber: entry.nutrition?.fiber ?? 0,
              tags: entry.tags || [],
            }
          : {
              id: entry._id,
              name: entry.name,
              category: entry.category,
              serving: '100 g raw',
              calories: entry.caloriesPer100g,
              protein: entry.proteinPer100g,
              carbs: entry.carbsPer100g,
              fat: entry.fatPer100g,
              fiber: entry.fiberPer100g,
              source: entry.source,
              isActive: entry.isActive !== false,
              imageUrl: entry.imageUrl,
            }
      ),
    });
  } catch (error) {
    fail(res, error);
  }
};

// @desc    Publish or hide a vegetable in the member explorer
// @route   PATCH /api/admin/vegetables/:id
exports.updateVegetable = async (req, res) => {
  try {
    if (typeof req.body.isActive !== 'boolean') return fail(res, 'isActive must be true or false');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 'Vegetable not found');
    const vegetable = await Vegetable.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true }
    ).select('name isActive');
    if (!vegetable) return fail(res, 'Vegetable not found');
    ok(res, { id: vegetable._id, isActive: vegetable.isActive }, vegetable.isActive ? 'Vegetable published' : 'Vegetable hidden');
  } catch (error) {
    fail(res, error);
  }
};

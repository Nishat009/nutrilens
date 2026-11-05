const WeightLog = require('../models/WeightLog');
const Meal = require('../models/Meal');
const User = require('../models/User');
const { sendError } = require('../utils/http');

const MAX_WEIGHT_LOGS = 365;
const MAX_HISTORY_DAYS = 365;
// YYYY-MM-DD, optionally followed by an ISO time (which is dropped: one weight entry per day).
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/;

// The newest `MAX_WEIGHT_LOGS` entries, returned oldest first for the trend chart.
const recentWeightLogs = async (userId) =>
  (await WeightLog.find({ userId }).sort({ date: -1 }).limit(MAX_WEIGHT_LOGS).lean()).reverse();

// @desc    Get weight logs (latest 365 entries, oldest first)
// @route   GET /api/progress/weight
exports.getWeightLogs = async (req, res) => {
  try {
    const logs = await recentWeightLogs(req.user._id);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Weight logs retrieved successfully',
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve weight logs');
  }
};

// @desc    Log a weight entry
// @route   POST /api/progress/weight
exports.logWeight = async (req, res) => {
  try {
    const { date, notes } = req.body;
    const weightKg = Number(req.body.weightKg);

    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
      return sendError(res, 'Please provide a weight value in kg (20-400)');
    }
    // `date` goes into the upsert filter, so it must be a plain YYYY-MM-DD string.
    if (date !== undefined && !(typeof date === 'string' && DATE_PATTERN.test(date))) {
      return sendError(res, 'Date must be YYYY-MM-DD (or an ISO date-time)');
    }

    const userId = req.user._id;
    const logDate = (date || new Date().toISOString()).slice(0, 10);

    // Upsert weight log for the given date
    const log = await WeightLog.findOneAndUpdate(
      { userId, date: logDate },
      { weightKg, notes: typeof notes === 'string' ? notes.slice(0, 500) : '' },
      { new: true, upsert: true, runValidators: true }
    );

    // Also update current weight on User profile
    await User.updateOne({ _id: userId }, { weightKg });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Weight logged successfully',
      data: log,
    });
  } catch (error) {
    sendError(res, error, 'Failed to log weight entry');
  }
};

// @desc    Get daily nutrition progress aggregated from meals
// @route   GET /api/progress/nutrition
exports.getNutritionHistory = async (req, res) => {
  try {
    const daysCount = Math.min(MAX_HISTORY_DAYS, Math.max(1, parseInt(req.query.days, 10) || 30));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    const startDateStr = startDate.toISOString().split('T')[0];

    const filter = { userId: req.user._id, date: { $gte: startDateStr } };

    const meals = await Meal.find(filter)
      .sort({ date: 1 })
      .select('date totalCalories totalProtein totalCarbs totalFat totalFiber')
      .lean();

    // Group meals by date
    const historyMap = {};
    meals.forEach((meal) => {
      if (!historyMap[meal.date]) {
        historyMap[meal.date] = {
          date: meal.date,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          mealsLoggedCount: 0,
          waterIntakeMl: 0,
        };
      }
      historyMap[meal.date].totalCalories += meal.totalCalories;
      historyMap[meal.date].totalProtein += meal.totalProtein;
      historyMap[meal.date].totalCarbs += meal.totalCarbs;
      historyMap[meal.date].totalFat += meal.totalFat;
      historyMap[meal.date].totalFiber += meal.totalFiber;
      historyMap[meal.date].mealsLoggedCount += 1;
    });

    const history = Object.values(historyMap);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Nutrition history retrieved successfully',
      count: history.length,
      data: history,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve nutrition history');
  }
};

// @desc    Get overall progress summary (weight and recent nutrition)
// @route   GET /api/progress
exports.getProgressSummary = async (req, res) => {
  try {
    const [weightLogs, mealCount] = await Promise.all([
      recentWeightLogs(req.user._id),
      Meal.countDocuments({ userId: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Progress summary retrieved successfully',
      data: {
        weightLogs,
        recentMealsCount: Math.min(mealCount, 30),
      },
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve progress summary');
  }
};


const WeightLog = require('../models/WeightLog');
const Meal = require('../models/Meal');
const User = require('../models/User');

// @desc    Get weight logs
// @route   GET /api/progress/weight
exports.getWeightLogs = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;

    const logs = await WeightLog.find(filter).sort({ date: 1 });
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Weight logs retrieved successfully',
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve weight logs'],
    });
  }
};

// @desc    Log a weight entry
// @route   POST /api/progress/weight
exports.logWeight = async (req, res) => {
  try {
    let { userId, date, weightKg, notes } = req.body;

    if (!weightKg) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Please provide a weight value in kg'],
      });
    }

    if (!userId) {
      const defaultUser = await User.findOne();
      if (defaultUser) userId = defaultUser._id;
    }

    const logDate = date || new Date().toISOString().split('T')[0];

    // Upsert weight log for the given date
    const log = await WeightLog.findOneAndUpdate(
      { userId, date: logDate },
      { weightKg, notes: notes || '' },
      { new: true, upsert: true }
    );

    // Also update current weight on User profile
    if (userId) {
      await User.findByIdAndUpdate(userId, { weightKg });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Weight logged successfully',
      data: log,
    });
  } catch (error) {
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'Failed to log weight entry'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};

// @desc    Get daily nutrition progress aggregated from meals
// @route   GET /api/progress/nutrition
exports.getNutritionHistory = async (req, res) => {
  try {
    const { userId, days = 30 } = req.query;
    const daysCount = parseInt(days, 10) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    const startDateStr = startDate.toISOString().split('T')[0];

    const filter = { date: { $gte: startDateStr } };
    if (userId) filter.userId = userId;

    const meals = await Meal.find(filter).sort({ date: 1 });

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
          waterIntakeMl: 2400,
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
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve nutrition history'],
    });
  }
};

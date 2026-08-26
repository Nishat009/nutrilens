const mongoose = require('mongoose');
const Meal = require('../models/Meal');
const User = require('../models/User');

async function resolveUserId(rawId) {
  if (!rawId || rawId === 'current' || rawId === 'default' || !mongoose.Types.ObjectId.isValid(rawId)) {
    const defaultUser = await User.findOne();
    return defaultUser ? defaultUser._id : null;
  }
  return rawId;
}

// @desc    Get meals (with optional filters by userId and date)
// @route   GET /api/meals
exports.getMeals = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Meals retrieved (offline mode)',
        count: 0,
        data: [],
      });
    }

    const { userId, date } = req.query;
    const filter = {};

    if (userId && userId !== 'current' && userId !== 'default') {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.userId = userId;
      } else {
        const resolved = await resolveUserId(userId);
        if (resolved) filter.userId = resolved;
      }
    }
    if (date) {
      filter.date = date;
    }

    const meals = await Meal.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meals retrieved successfully',
      count: meals.length,
      data: meals,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meals retrieved (fallback)',
      count: 0,
      data: [],
    });
  }
};

// @desc    Get meal by ID
// @route   GET /api/meals/:id
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Meal not found'],
      });
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal retrieved successfully',
      data: meal,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve meal details'],
    });
  }
};

// @desc    Create new meal entry
// @route   POST /api/meals
exports.createMeal = async (req, res) => {
  try {
    let { userId, type, date, time, items, imageUrl, notes } = req.body;

    userId = await resolveUserId(userId);

    if (!userId) {
      const newUser = await User.create({ name: 'User', email: 'user@nutrilens.ai' });
      userId = newUser._id;
    }

    // Compute totals if items array provided and totals not explicitly set
    let totalCalories = req.body.totalCalories || 0;
    let totalProtein = req.body.totalProtein || 0;
    let totalCarbs = req.body.totalCarbs || 0;
    let totalFat = req.body.totalFat || 0;
    let totalFiber = req.body.totalFiber || 0;

    if (items && items.length > 0 && !req.body.totalCalories) {
      totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
      totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
      totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
      totalFat = items.reduce((sum, item) => sum + (item.fat || 0), 0);
      totalFiber = items.reduce((sum, item) => sum + (item.fiber || 0), 0);
    }

    const meal = await Meal.create({
      userId,
      type: type || 'lunch',
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toTimeString().slice(0, 5),
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      totalFiber: Math.round(totalFiber * 10) / 10,
      items: items || [],
      imageUrl: imageUrl || '',
      notes: notes || '',
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal created successfully',
      data: meal,
    });
  } catch (error) {
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'Failed to create meal'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Meal not found'],
      });
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to delete meal'],
    });
  }
};

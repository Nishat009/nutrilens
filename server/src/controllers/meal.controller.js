const { sendError, sendUnexpectedError } = require('../utils/http');
const Meal = require('../models/Meal');

// @desc    Get the authenticated user's meals (optionally filtered by date)
// @route   GET /api/meals
exports.getMeals = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.date) {
      filter.date = String(req.query.date);
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
    return sendUnexpectedError(res, error, 'Failed to retrieve meals');
  }
};

// @desc    Get meal by ID
// @route   GET /api/meals/:id
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!meal) {
      return sendError(res, 404, 'Meal not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal retrieved successfully',
      data: meal,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to retrieve meal details');
  }
};

// @desc    Create new meal entry
// @route   POST /api/meals
exports.createMeal = async (req, res) => {
  try {
    let { type, date, time, items, imageUrl, notes } = req.body;
    const userId = req.user._id;

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
    return sendUnexpectedError(res, error, 'Failed to create meal');
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!meal) {
      return sendError(res, 404, 'Meal not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Failed to delete meal');
  }
};

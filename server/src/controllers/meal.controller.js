const Meal = require('../models/Meal');
const { sendError } = require('../utils/http');
const { sumNutrients } = require('../utils/nutrients');
const { MAX_SCAN_IMAGE_BYTES } = require('../config/app');

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 200;

// @desc    Get the signed-in member's meals (optionally for one date), newest first, one page at a time
//          (?page=1&limit=100, max 200). The photo is left out of the list; GET /api/meals/:id returns it.
// @route   GET /api/meals
exports.getMeals = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { userId: req.user._id };
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));

    if (date) {
      filter.date = String(date);
    }

    const [total, meals] = await Promise.all([
      Meal.countDocuments(filter),
      Meal.find(filter)
        .select('-imageUrl')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meals retrieved successfully',
      count: meals.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: meals,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve meals');
  }
};

// @desc    Get meal by ID
// @route   GET /api/meals/:id
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!meal) {
      return sendError(res, 'Meal not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal retrieved successfully',
      data: meal,
    });
  } catch (error) {
    sendError(res, error, 'Failed to retrieve meal details');
  }
};

// @desc    Create new meal entry
// @route   POST /api/meals
exports.createMeal = async (req, res) => {
  try {
    let { type, date, time, items, imageUrl, notes } = req.body;
    const userId = req.user._id;
    if (imageUrl && (typeof imageUrl !== 'string' || imageUrl.length > MAX_SCAN_IMAGE_BYTES)) {
      return sendError(res, 'Meal photo is too large. Please upload a smaller photo.');
    }

    // Compute totals if items array provided and totals not explicitly set
    let totalCalories = req.body.totalCalories || 0;
    let totalProtein = req.body.totalProtein || 0;
    let totalCarbs = req.body.totalCarbs || 0;
    let totalFat = req.body.totalFat || 0;
    let totalFiber = req.body.totalFiber || 0;

    if (items && items.length > 0 && !req.body.totalCalories) {
      ({ calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat, fiber: totalFiber } = sumNutrients(items));
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
    sendError(res, error, 'Failed to create meal');
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!meal) {
      return sendError(res, 'Meal not found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    sendError(res, error, 'Failed to delete meal');
  }
};

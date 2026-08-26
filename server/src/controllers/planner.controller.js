const mongoose = require('mongoose');
const PlannedMeal = require('../models/PlannedMeal');
const User = require('../models/User');

async function resolveUserId(rawId) {
  if (!rawId || rawId === 'current' || rawId === 'default' || !mongoose.Types.ObjectId.isValid(rawId)) {
    const defaultUser = await User.findOne();
    return defaultUser ? defaultUser._id : null;
  }
  return rawId;
}

// @desc    Get planned meals (filterable by userId and dayOfWeek)
// @route   GET /api/planner
exports.getPlannedMeals = async (req, res) => {
  try {
    const { userId, dayOfWeek } = req.query;
    const filter = {};

    const resolved = await resolveUserId(userId);
    if (resolved) filter.userId = resolved;

    if (dayOfWeek !== undefined && dayOfWeek !== '') {
      filter.dayOfWeek = parseInt(dayOfWeek, 10);
    }

    const plannedMeals = await PlannedMeal.find(filter).sort({
      dayOfWeek: 1,
      createdAt: 1,
    });
    res.status(200).json({
      success: true,
      code: 200,
      message: 'Planned meals retrieved successfully',
      count: plannedMeals.length,
      data: plannedMeals,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve planned meals'],
    });
  }
};

// @desc    Add a planned meal slot
// @route   POST /api/planner
exports.addPlannedMeal = async (req, res) => {
  try {
    let { userId, dayOfWeek, mealType, foodName, calories, protein, carbs, fat } =
      req.body;

    if (!foodName) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Food name is required'],
      });
    }

    if (dayOfWeek === undefined) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Day of week is required (0-6)'],
      });
    }

    userId = await resolveUserId(userId);

    const plannedMeal = await PlannedMeal.create({
      userId,
      dayOfWeek: parseInt(dayOfWeek, 10),
      mealType: mealType || 'lunch',
      foodName,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Planned meal slot created successfully',
      data: plannedMeal,
    });
  } catch (error) {
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'Failed to create planned meal slot'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};

// @desc    Delete a planned meal slot
// @route   DELETE /api/planner/:id
exports.deletePlannedMeal = async (req, res) => {
  try {
    const plannedMeal = await PlannedMeal.findByIdAndDelete(req.params.id);
    if (!plannedMeal) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Planned meal slot not found'],
      });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Planned meal slot deleted successfully',
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to delete planned meal slot'],
    });
  }
};

const { sendError, sendUnexpectedError } = require('../utils/http');
const User = require('../models/User');
const Meal = require('../models/Meal');
const FoodScan = require('../models/FoodScan');
const PlannedMeal = require('../models/PlannedMeal');
const WeightLog = require('../models/WeightLog');
const { verifyPassword } = require('../utils/password');

const PROFILE_FIELDS = [
  'name', 'email', 'gender', 'dob', 'heightCm', 'weightKg', 'targetWeightKg',
  'waistCm', 'activityLevel', 'primaryGoal', 'goalPace', 'healthConditions',
  'foodPreferences', 'commonFoodsEaten', 'allergies', 'lifestyle',
  'dietaryPreferences', 'avatarUrl', 'activeDietId', 'medicalConditions',
  'medications', 'personalizedPlan', 'onboardingCompleted',
];
const GOAL_FIELDS = [
  'type', 'targetCalories', 'targetProteinG', 'targetCarbsG', 'targetFatG',
  'targetFiberG', 'targetWaterMl', 'weeklyWeightChangeKg', 'isActive',
];

const fail = (res, error) => sendUnexpectedError(res, error, 'Database operation failed');
const publicUser = (user) => {
  const result = user.toObject();
  delete result.password;
  return result;
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user || (req.params.id !== 'current' && req.params.id !== String(user._id))) {
      return sendError(res, 404, 'User profile not found');
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User profile retrieved successfully',
      data: publicUser(user),
    });
  } catch (error) {
    return fail(res, error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
exports.updateUserProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user || (req.params.id !== 'current' && req.params.id !== String(user._id))) {
      return sendError(res, 404, 'User not found');
    }

    for (const field of PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) user.set(field, req.body[field]);
    }
    if (req.body.goal && typeof req.body.goal === 'object') {
      for (const field of GOAL_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(req.body.goal, field)) user.set(`goal.${field}`, req.body.goal[field]);
      }
    }
    await user.save();

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User profile updated successfully',
      data: publicUser(user),
    });
  } catch (error) {
    return fail(res, error);
  }
};

// @desc    Update user nutrition goal
// @route   PUT /api/users/:id/goal
exports.updateUserGoal = async (req, res) => {
  try {
    const user = req.user;

    if (!user || (req.params.id !== 'current' && req.params.id !== String(user._id))) {
      return sendError(res, 404, 'User not found');
    }

    for (const field of GOAL_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) user.set(`goal.${field}`, req.body[field]);
    }
    await user.save();

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Nutrition goals updated successfully',
      data: user.goal,
    });
  } catch (error) {
    return fail(res, error);
  }
};

// @desc    Download everything stored about the signed-in user
// @route   GET /api/users/current/export
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const [meals, scans, plannedMeals, weightLogs] = await Promise.all([
      Meal.find({ userId }).sort({ date: 1, time: 1 }).lean(),
      FoodScan.find({ userId }).sort({ createdAt: 1 }).lean(),
      PlannedMeal.find({ userId }).lean(),
      WeightLog.find({ userId }).sort({ date: 1 }).lean(),
    ]);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Data export generated successfully',
      data: { exportedAt: new Date().toISOString(), profile: publicUser(req.user), meals, scans, plannedMeals, weightLogs },
    });
  } catch (error) {
    return fail(res, error);
  }
};

// @desc    Permanently delete the account and all of its data
// @route   DELETE /api/users/current
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body || {};
    if (typeof password !== 'string' || !password) {
      return sendError(res, 422, 'Password is required to delete your account');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !verifyPassword(password, user.password)) {
      return sendError(res, 403, 'Password is incorrect');
    }

    const userId = user._id;
    await Promise.all([
      Meal.deleteMany({ userId }),
      FoodScan.deleteMany({ userId }),
      PlannedMeal.deleteMany({ userId }),
      WeightLog.deleteMany({ userId }),
    ]);
    await User.deleteOne({ _id: userId });

    res.status(200).json({ success: true, code: 200, message: 'Account deleted successfully' });
  } catch (error) {
    return fail(res, error);
  }
};

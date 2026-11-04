const User = require('../models/User');
const { sendError } = require('../utils/http');

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

const fail = (res, error) => sendError(res, error, 'Database operation failed');
const publicUser = (user) => {
  const result = user.toObject();
  delete result.password;
  return result;
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
  try {
    const user = req.user; // ownership checked by requireSelf

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
    const user = req.user; // ownership checked by requireSelf

    for (const field of PROFILE_FIELDS) {
      // Shared demo logins keep their published email so the one-click login keeps working.
      if (field === 'email' && user.isDemo) continue;
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
    const user = req.user; // ownership checked by requireSelf

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

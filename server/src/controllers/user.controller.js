const mongoose = require('mongoose');
const User = require('../models/User');

const DEFAULT_USER_DATA = {
  id: 'usr_default_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@nutrilens.ai',
  gender: 'male',
  dob: '1998-05-14',
  heightCm: 178,
  weightKg: 74.5,
  targetWeightKg: 72.0,
  activityLevel: 'moderately_active',
  dietaryPreferences: ['High Protein / Gym', 'Mediterranean'],
  allergies: [],
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  goal: {
    type: 'lose_weight',
    targetCalories: 2150,
    targetProteinG: 160,
    targetCarbsG: 210,
    targetFatG: 65,
    targetFiberG: 32,
    targetWaterMl: 3000,
    weeklyWeightChangeKg: -0.5,
    isActive: true,
  },
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
  try {
    // If DB is offline, return default profile immediately
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        code: 200,
        message: 'User profile retrieved (offline fallback mode)',
        data: DEFAULT_USER_DATA,
      });
    }

    let user;
    if (req.params.id === 'current' || req.params.id === 'default') {
      user = await User.findOne();
    } else {
      user = await User.findById(req.params.id);
    }

    if (!user) {
      // Auto-provision default user if DB is connected but not seeded yet
      try {
        user = await User.create(DEFAULT_USER_DATA);
      } catch {
        return res.status(200).json({
          success: true,
          code: 200,
          message: 'User profile retrieved (default)',
          data: DEFAULT_USER_DATA,
        });
      }
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    // Fallback gracefully on any DB query error
    res.status(200).json({
      success: true,
      code: 200,
      message: 'User profile retrieved (fallback)',
      data: DEFAULT_USER_DATA,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
exports.updateUserProfile = async (req, res) => {
  try {
    let user;
    if (req.params.id === 'current' || req.params.id === 'default') {
      user = await User.findOne();
    } else {
      user = await User.findById(req.params.id);
    }

    if (!user) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['User not found'],
      });
    }

    Object.assign(user, req.body);
    await user.save();

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User profile updated successfully',
      data: user,
    });
  } catch (error) {
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'Failed to update user profile'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};

// @desc    Update user nutrition goal
// @route   PUT /api/users/:id/goal
exports.updateUserGoal = async (req, res) => {
  try {
    let user;
    if (req.params.id === 'current' || req.params.id === 'default') {
      user = await User.findOne();
    } else {
      user = await User.findById(req.params.id);
    }

    if (!user) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['User not found'],
      });
    }

    user.goal = { ...user.goal?.toObject(), ...req.body };
    await user.save();

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Nutrition goals updated successfully',
      data: user.goal,
    });
  } catch (error) {
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'Failed to update user goals'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};

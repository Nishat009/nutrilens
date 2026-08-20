const User = require('../models/User');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
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

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'Failed to retrieve user profile'],
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

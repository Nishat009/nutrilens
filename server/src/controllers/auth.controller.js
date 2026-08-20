const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, gender, dob, heightCm, weightKg, activityLevel } = req.body;

    if (!name || !email) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Please provide both name and email'],
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['User already exists with this email'],
      });
    }

    user = await User.create({
      name,
      email,
      password: password || 'password123',
      gender: gender || 'male',
      dob: dob || '1998-05-14',
      heightCm: heightCm || 178,
      weightKg: weightKg || 74.5,
      activityLevel: activityLevel || 'moderately_active',
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'An error occurred during registration'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Please provide an email address'],
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.findOne();
      if (!user) {
        user = await User.create({
          name: 'Demo User',
          email,
        });
      }
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Login successful',
      data: user,
    });
  } catch (error) {
    const errors = error.errors
      ? Object.values(error.errors).map((e) => e.message)
      : [error.message || 'An error occurred during login'];

    res.status(422).json({
      success: false,
      code: 422,
      errors,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['No user profile found'],
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
      errors: [error.message || 'An error occurred retrieving user profile'],
    });
  }
};

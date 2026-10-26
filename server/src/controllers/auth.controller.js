const User = require('../models/User');
const { createToken } = require('../middleware/auth');
const { encodePassword, passwordMatches } = require('../utils/password');
const { refreshDemoActivity } = require('../services/demo-accounts');

const serializeUser = (user) => {
  const result = user.toObject ? user.toObject() : { ...user };
  delete result.password;
  result.onboardingCompleted = Boolean(result.onboardingCompleted || result.personalizedPlan);
  return result;
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, gender, dob, heightCm, weightKg, activityLevel } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Name, email, and a password of at least 8 characters are required'],
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
      password: encodePassword(password),
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
      data: { user: serializeUser(user), token: createToken(user._id) },
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
    const { email, password, clientDate } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Please provide both email and password'],
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !passwordMatches(password, user.password)) {
      return res.status(422).json({
        success: false,
        code: 422,
        errors: ['Invalid email or password'],
      });
    }

    if (!user.password.startsWith('scrypt$')) {
      user.password = encodePassword(password);
      await user.save();
    }

    // Keep the shared demo workspace populated up to the visitor's local "today".
    if (user.isDemo) {
      await refreshDemoActivity(clientDate).catch((error) => {
        console.warn('Demo activity refresh skipped:', error.message);
      });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Login successful',
      data: { user: serializeUser(user), token: createToken(user._id) },
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
    const user = req.user;
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
      data: serializeUser(user),
    });
  } catch (error) {
    res.status(422).json({
      success: false,
      code: 422,
      errors: [error.message || 'An error occurred retrieving user profile'],
    });
  }
};

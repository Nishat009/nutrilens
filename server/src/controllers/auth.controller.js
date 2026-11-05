const User = require('../models/User');
const { createToken } = require('../middleware/auth');
const { encodePassword, passwordMatches } = require('../utils/password');
const { refreshDemoActivity, findDemoLoginUser } = require('../services/demo-accounts');
const { sendError } = require('../utils/http');

// Body profile fields a member may supply at sign-up; anything left out takes the User model
// default until onboarding replaces it. `role` and other privileged fields are never accepted.
const REGISTRATION_FIELDS = ['gender', 'dob', 'heightCm', 'weightKg', 'activityLevel'];

// Keep the shared demo workspace populated up to the visitor's local "today"; never fail a login over it.
const refreshDemoSafely = (clientDate) =>
  refreshDemoActivity(clientDate).catch((error) => {
    console.warn('Demo activity refresh skipped:', error.message);
  });

const serializeUser = (user) => {
  const result = user.toObject ? user.toObject() : { ...user };
  delete result.password;
  result.onboardingCompleted = Boolean(result.onboardingCompleted || result.personalizedPlan);
  return result;
};

// Only plain strings reach a query filter, so an object such as {"$ne":null} cannot act as an operator.
const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (typeof name !== 'string' || !name.trim() || !email || typeof password !== 'string' || password.length < 8) {
      return sendError(res, 'Name, email, and a password of at least 8 characters are required');
    }

    // The unique email index rejects duplicates, including two sign-ups racing each other (code 11000).
    const profile = {};
    for (const field of REGISTRATION_FIELDS) {
      if (req.body[field] !== undefined && req.body[field] !== '') profile[field] = req.body[field];
    }
    const user = await User.create({ ...profile, name, email, password: encodePassword(password) });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User registered successfully',
      data: { user: serializeUser(user), token: createToken(user) },
    });
  } catch (error) {
    if (error?.code === 11000) return sendError(res, 'User already exists with this email');
    sendError(res, error, 'An error occurred during registration');
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { password, clientDate } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || typeof password !== 'string' || !password) {
      return sendError(res, 'Please provide both email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !passwordMatches(password, user.password)) {
      return sendError(res, 'Invalid email or password');
    }

    if (!user.password.startsWith('scrypt$')) {
      user.password = encodePassword(password);
      await user.save();
    }

    if (user.isDemo) await refreshDemoSafely(clientDate);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Login successful',
      data: { user: serializeUser(user), token: createToken(user) },
    });
  } catch (error) {
    sendError(res, error, 'An error occurred during login');
  }
};

// @desc    One-click demo sign-in (DEMO_MODE only); the browser never sends or stores a demo password
// @route   POST /api/auth/demo-login
exports.demoLogin = async (req, res) => {
  try {
    const role = req.body.role === 'admin' ? 'admin' : 'user';
    const user = await findDemoLoginUser(role);
    if (!user) return sendError(res, 'The live demo is not enabled on this server', 'Demo login unavailable', 404);

    await refreshDemoSafely(req.body.clientDate);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Demo login successful',
      data: { user: serializeUser(user), token: createToken(user) },
    });
  } catch (error) {
    sendError(res, error, 'An error occurred during demo login');
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return sendError(res, 'No user profile found');
    }
    res.status(200).json({
      success: true,
      code: 200,
      message: 'User profile retrieved successfully',
      data: serializeUser(user),
    });
  } catch (error) {
    sendError(res, error, 'An error occurred retrieving user profile');
  }
};

// @desc    Sign out of every device: bumps tokenVersion so all previously issued tokens stop working
// @route   POST /api/auth/logout-all
exports.logoutAll = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    res.status(200).json({ success: true, code: 200, message: 'Signed out of all sessions' });
  } catch (error) {
    sendError(res, error, 'Failed to sign out of all sessions');
  }
};

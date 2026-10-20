const crypto = require('crypto');
const User = require('../models/User');
const { createToken } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/password');
const { sendError, sendUnexpectedError } = require('../utils/http');
const mailer = require('../utils/mailer');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_PASSWORD_LENGTH = 8;

const serializeUser = (user) => {
  const result = user.toObject ? user.toObject() : { ...user };
  delete result.password;
  delete result.passwordResetTokenHash;
  delete result.passwordResetExpires;
  result.onboardingCompleted = Boolean(result.onboardingCompleted || result.personalizedPlan);
  return result;
};

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (typeof name !== 'string' || !name.trim() || !email || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return sendError(res, 422, `Name, email, and a password of at least ${MIN_PASSWORD_LENGTH} characters are required`);
    }

    if (await User.exists({ email })) {
      return sendError(res, 409, 'User already exists with this email');
    }

    // Biometrics are collected during onboarding, so none are invented here.
    const user = await User.create({
      name: name.trim(),
      email,
      password: hashPassword(password),
    });

    res.status(200).json({
      success: true,
      code: 200,
      message: 'User registered successfully',
      data: { user: serializeUser(user), token: createToken(user._id) },
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'An error occurred during registration');
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || typeof password !== 'string' || !password) {
      return sendError(res, 422, 'Please provide both email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !verifyPassword(password, user.password)) {
      return sendError(res, 401, 'Invalid email or password');
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Login successful',
      data: { user: serializeUser(user), token: createToken(user._id) },
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'An error occurred during login');
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    code: 200,
    message: 'User profile retrieved successfully',
    data: serializeUser(req.user),
  });
};

// @desc    Email a password reset link
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  // Same response whether or not the account exists, so emails can't be enumerated.
  const genericResponse = {
    success: true,
    code: 200,
    message: 'If an account exists for that email, a password reset link has been sent.',
  };

  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return sendError(res, 422, 'Please provide your email address');

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(genericResponse);

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashResetToken(token);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await mailer.sendMail({
      to: user.email,
      subject: 'Reset your NutriLens password',
      text: [
        `Hi ${user.name},`,
        '',
        'We received a request to reset your NutriLens password. Open this link to choose a new one:',
        resetUrl,
        '',
        'The link expires in 1 hour. If you did not request this, you can ignore this email.',
      ].join('\n'),
    });

    res.status(200).json(genericResponse);
  } catch (error) {
    return sendUnexpectedError(res, error, 'Could not send the password reset email');
  }
};

// @desc    Set a new password using a reset token
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== 'string' || !token) {
      return sendError(res, 422, 'Reset token is required');
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return sendError(res, 422, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires');
    if (!user) {
      return sendError(res, 400, 'This reset link is invalid or has expired. Please request a new one.');
    }

    user.password = hashPassword(password);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Password updated successfully. You can now sign in.',
    });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Could not reset password');
  }
};

// @desc    Change password for the signed-in user
// @route   POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return sendError(res, 422, 'Current password is required');
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return sendError(res, 422, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (newPassword === currentPassword) {
      return sendError(res, 422, 'New password must be different from the current password');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !verifyPassword(currentPassword, user.password)) {
      return sendError(res, 403, 'Current password is incorrect');
    }

    user.password = hashPassword(newPassword);
    await user.save();

    res.status(200).json({ success: true, code: 200, message: 'Password changed successfully' });
  } catch (error) {
    return sendUnexpectedError(res, error, 'Could not change password');
  }
};

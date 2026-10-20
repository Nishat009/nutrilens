const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, changePassword } =require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rate-limit');

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  message: 'Too many attempts, please try again in a few minutes',
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/change-password', authLimiter, requireAuth, changePassword);
router.get('/me', requireAuth, getMe);

module.exports = router;

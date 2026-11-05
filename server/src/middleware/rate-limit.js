const rateLimit = require('express-rate-limit');

// Clients are identified by req.ip, which comes from X-Forwarded-For because the API runs behind
// Render / Vercel proxies (`trust proxy` in index.js). The permissive-proxy check is turned off for that reason.
const options = (windowMinutes, limit, message) => ({
  windowMs: windowMinutes * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { success: false, code: 429, errors: [message] },
});

// Every /api request: generous, stops scripted floods.
const apiLimiter = rateLimit(options(15, 1000, 'Too many requests, please try again in a few minutes'));

// Sign-in and sign-up: slows down password guessing.
const authLimiter = rateLimit(options(15, 30, 'Too many sign-in attempts, please try again in 15 minutes'));

module.exports = { apiLimiter, authLimiter };

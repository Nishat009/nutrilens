// Public: register, login, demo-login (rate-limited). Signed-in only: me, logout-all.
const express = require('express');
const router = express.Router();
const { register, login, demoLogin, getMe, logoutAll } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rate-limit');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/demo-login', authLimiter, demoLogin);
router.get('/me', requireAuth, getMe);
router.post('/logout-all', requireAuth, logoutAll);

module.exports = router;

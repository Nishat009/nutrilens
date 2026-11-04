const express = require('express');
const router = express.Router();
const { requireAuth, requireSelf } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  updateUserGoal,
} = require('../controllers/user.controller');

// Every route acts on the caller's own record only.
router.use(requireAuth);
router.get('/:id', requireSelf, getUserProfile);
router.put('/:id', requireSelf, updateUserProfile);
router.put('/:id/goal', requireSelf, updateUserGoal);

module.exports = router;

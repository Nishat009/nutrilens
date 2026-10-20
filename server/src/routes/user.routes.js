const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  updateUserGoal,
  exportUserData,
  deleteAccount,
} = require('../controllers/user.controller');

router.use(requireAuth);
router.get('/current/export', exportUserData);
router.delete('/current', deleteAccount);
router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);
router.put('/:id/goal', updateUserGoal);

module.exports = router;

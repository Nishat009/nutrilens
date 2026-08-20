const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updateUserGoal,
} = require('../controllers/user.controller');

router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);
router.put('/:id/goal', updateUserGoal);

module.exports = router;

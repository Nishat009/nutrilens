// Meal log: every route needs requireAuth; controllers filter by { _id, userId: req.user._id },
// so one member can never read or delete another member's meal. Checked by tests/route-guards.test.js.
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getMeals,
  getMealById,
  createMeal,
  deleteMeal,
} = require('../controllers/meal.controller');

router.use(requireAuth);
router.get('/', getMeals);
router.get('/:id', getMealById);
router.post('/', createMeal);
router.delete('/:id', deleteMeal);

module.exports = router;

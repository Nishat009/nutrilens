const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
} = require('../controllers/meal.controller');

router.use(requireAuth);

router.get('/', getMeals);
router.get('/:id', getMealById);
router.post('/', createMeal);
router.put('/:id', updateMeal);
router.delete('/:id', deleteMeal);

module.exports = router;

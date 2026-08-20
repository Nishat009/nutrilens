const express = require('express');
const router = express.Router();
const {
  getMeals,
  getMealById,
  createMeal,
  deleteMeal,
} = require('../controllers/meal.controller');

router.get('/', getMeals);
router.get('/:id', getMealById);
router.post('/', createMeal);
router.delete('/:id', deleteMeal);

module.exports = router;

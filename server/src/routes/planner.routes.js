const express = require('express');
const router = express.Router();
const {
  getPlannedMeals,
  addPlannedMeal,
  deletePlannedMeal,
} = require('../controllers/planner.controller');

router.get('/', getPlannedMeals);
router.post('/', addPlannedMeal);
router.delete('/:id', deletePlannedMeal);

module.exports = router;

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getPlannedMeals,
  addPlannedMeal,
  deletePlannedMeal,
} = require('../controllers/planner.controller');

router.use(requireAuth);

router.get('/', getPlannedMeals);
router.post('/', addPlannedMeal);
router.delete('/:id', deletePlannedMeal);

module.exports = router;

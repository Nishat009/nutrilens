const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getVegetables,
  searchVegetables,
  getCategories,
  matchVegetables,
  getVegetableByIdOrSlug,
  calculateNutrition,
} = require('../controllers/vegetable.controller');

// Specific sub-routes first to avoid :idOrSlug collision
router.get('/search', searchVegetables);
router.get('/categories', getCategories);
router.post('/match', requireAuth, matchVegetables);

// Listing route
router.get('/', getVegetables);

// Parametric routes
router.get('/:idOrSlug', getVegetableByIdOrSlug);
router.post('/:idOrSlug/calculate', requireAuth, calculateNutrition);

module.exports = router;

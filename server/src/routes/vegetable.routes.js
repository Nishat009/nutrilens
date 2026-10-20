const express = require('express');
const router = express.Router();
const {
  getVegetables,
  searchVegetables,
  getCategories,
  matchVegetables,
  getVegetableByIdOrSlug,
  calculateNutrition,
} = require('../controllers/vegetable.controller');

// Public endpoints: read-only reference data; the POST routes only compute, they store nothing.
// Specific sub-routes first to avoid :idOrSlug collision
router.get('/search', searchVegetables);
router.get('/categories', getCategories);
router.post('/match', matchVegetables);

// Listing route
router.get('/', getVegetables);

// Parametric routes
router.get('/:idOrSlug', getVegetableByIdOrSlug);
router.post('/:idOrSlug/calculate', calculateNutrition);

module.exports = router;

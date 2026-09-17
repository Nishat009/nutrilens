const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getDiets,
  getDietBySlug,
  adoptDiet,
  getPersonalizedRecommendation,
  getFoodSwapAlternatives,
  submitAdaptiveReview,
  getRecommendations,
} = require('../controllers/diet.controller');

// Personalized recommendation & tools
router.post('/recommend', requireAuth, getPersonalizedRecommendation);
router.post('/swap-food', requireAuth, getFoodSwapAlternatives);
router.post('/adaptive-review', requireAuth, submitAdaptiveReview);
router.post('/adopt', requireAuth, adoptDiet);

// Diet protocols catalogue
router.get('/', getDiets);
router.get('/recommendations', getRecommendations);
router.get('/:slug', getDietBySlug);

module.exports = router;


// Diet catalogue reads (GET / and GET /:slug) are public; everything personalised or mutating
// needs requireAuth and acts on req.user only. Checked by tests/route-guards.test.js.
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
router.get('/recommendations', requireAuth, getRecommendations);
router.get('/:slug', getDietBySlug);

module.exports = router;


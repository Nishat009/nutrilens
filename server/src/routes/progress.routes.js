// Progress and weight logs: every route needs requireAuth; data is scoped to req.user.
// Checked by tests/route-guards.test.js.
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getProgressSummary,
  getWeightLogs,
  logWeight,
  getNutritionHistory,
} = require('../controllers/progress.controller');

router.use(requireAuth);
router.get('/', getProgressSummary);
router.get('/weight', getWeightLogs);
router.post('/weight', logWeight);
router.get('/nutrition', getNutritionHistory);

module.exports = router;


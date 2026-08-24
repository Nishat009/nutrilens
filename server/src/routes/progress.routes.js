const express = require('express');
const router = express.Router();
const {
  getProgressSummary,
  getWeightLogs,
  logWeight,
  getNutritionHistory,
} = require('../controllers/progress.controller');

router.get('/', getProgressSummary);
router.get('/weight', getWeightLogs);
router.post('/weight', logWeight);
router.get('/nutrition', getNutritionHistory);

module.exports = router;


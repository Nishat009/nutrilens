const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getScans,
  getScanById,
  createScan,
  analyzeFoodScan,
  teachFoodScan,
  getLearnedMatches,
  evaluateScanFood,
} = require('../controllers/scan.controller');

router.post('/analyze', requireAuth, analyzeFoodScan);
router.post('/evaluate', evaluateScanFood);
router.post('/teach', teachFoodScan);
router.get('/learned', getLearnedMatches);
router.get('/', requireAuth, getScans);
router.get('/:id', requireAuth, getScanById);
router.post('/', requireAuth, createScan);

module.exports = router;


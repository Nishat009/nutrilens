// AI food scans: every route needs requireAuth; scans and learned matches are scoped to req.user.
// Checked by tests/route-guards.test.js.
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
router.post('/evaluate', requireAuth, evaluateScanFood);
router.post('/teach', requireAuth, teachFoodScan);
router.get('/learned', requireAuth, getLearnedMatches);
router.get('/', requireAuth, getScans);
router.get('/:id', requireAuth, getScanById);
router.post('/', requireAuth, createScan);

module.exports = router;


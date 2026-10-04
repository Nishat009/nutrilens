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

router.use(requireAuth);

router.post('/analyze', analyzeFoodScan);
router.post('/evaluate', evaluateScanFood);
router.post('/teach', teachFoodScan);
router.get('/learned', getLearnedMatches);
router.get('/', getScans);
router.get('/:id', getScanById);
router.post('/', createScan);

module.exports = router;


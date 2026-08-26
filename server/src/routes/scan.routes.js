const express = require('express');
const router = express.Router();
const {
  getScans,
  getScanById,
  createScan,
  analyzeFoodScan,
  teachFoodScan,
  getLearnedMatches,
} = require('../controllers/scan.controller');

router.post('/analyze', analyzeFoodScan);
router.post('/teach', teachFoodScan);
router.get('/learned', getLearnedMatches);
router.get('/', getScans);
router.get('/:id', getScanById);
router.post('/', createScan);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getScans,
  getScanById,
  createScan,
  analyzeFoodScan,
} = require('../controllers/scan.controller');

router.post('/analyze', analyzeFoodScan);
router.get('/', getScans);
router.get('/:id', getScanById);
router.post('/', createScan);

module.exports = router;

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, blockDemoWrites } = require('../middleware/auth');
const {
  getFoods,
  getFoodById,
  createFood,
} = require('../controllers/food.controller');

router.get('/', getFoods);
router.get('/:id', getFoodById);
router.post('/', requireAuth, requireAdmin, blockDemoWrites, createFood);

module.exports = router;

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  getFoods,
  getFoodById,
  createFood,
} = require('../controllers/food.controller');

router.get('/', getFoods);
router.get('/:id', getFoodById);
router.post('/', requireAuth, requireAdmin, createFood);

module.exports = router;

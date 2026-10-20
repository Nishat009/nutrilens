const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  getFoods,
  getFoodById,
  createFood,
} = require('../controllers/food.controller');

// Public endpoints: the food catalogue is readable without login; only admins can add to it.
router.get('/', getFoods);
router.get('/:id', getFoodById);
router.post('/', requireAuth, requireAdmin, createFood);

module.exports = router;

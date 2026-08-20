const express = require('express');
const router = express.Router();
const {
  getFoods,
  getFoodById,
  createFood,
} = require('../controllers/food.controller');

router.get('/', getFoods);
router.get('/:id', getFoodById);
router.post('/', createFood);

module.exports = router;

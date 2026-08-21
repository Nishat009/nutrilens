const express = require('express');
const router = express.Router();
const {
  getDiets,
  getDietBySlug,
  adoptDiet,
} = require('../controllers/diet.controller');

router.get('/', getDiets);
router.get('/:slug', getDietBySlug);
router.post('/adopt', adoptDiet);

module.exports = router;

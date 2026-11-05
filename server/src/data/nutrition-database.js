// NutriLens food & vegetable nutrition database (per 100g, English + Bengali names, vision-AI aliases).
// The data lives in ../nutrition/nutrition-database.json, shared with the web scanner
// (web/src/data/nutrition-database.ts), so both sides always match the same foods.
const NUTRITION_DATABASE = require('../nutrition/nutrition-database.json');

module.exports = {
  NUTRITION_DATABASE,
};

// Sums calories and macros over a list of food items in one pass. Missing values count as 0.
function sumNutrients(items = []) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const item of items) {
    for (const key of Object.keys(totals)) totals[key] += Number(item?.[key]) || 0;
  }
  return totals;
}

module.exports = { sumNutrients };

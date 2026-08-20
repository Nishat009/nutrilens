const { NUTRITION_DATABASE } = require('../data/nutrition-database');

function calculateNutrition(food, quantityGrams) {
  const validQty = Math.max(0, quantityGrams);
  const factor = validQty / 100;

  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    fiber: Math.round(food.fiberPer100g * factor * 10) / 10,
  };
}

function calculateTotalNutrition(items) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: Math.round((acc.protein + (item.protein || 0)) * 10) / 10,
      carbs: Math.round((acc.carbs + (item.carbs || 0)) * 10) / 10,
      fat: Math.round((acc.fat + (item.fat || 0)) * 10) / 10,
      fiber: Math.round((acc.fiber + (item.fiber || 0)) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

function searchNutritionDatabase(query, category) {
  if (!query && !category) return NUTRITION_DATABASE.slice(0, 15);

  const cleanQuery = (query || '').toLowerCase().trim();

  return NUTRITION_DATABASE.filter((item) => {
    const matchesCategory = !category || item.category === category;
    if (!cleanQuery) return matchesCategory;

    const matchesName = item.name.toLowerCase().includes(cleanQuery);
    const matchesAlias = item.aliases.some((a) => a.toLowerCase().includes(cleanQuery));
    const matchesTag = item.tags.some((t) => t.toLowerCase().includes(cleanQuery));

    return matchesCategory && (matchesName || matchesAlias || matchesTag);
  });
}

function findBestFoodMatch(rawLabel) {
  const cleanLabel = (rawLabel || '').toLowerCase().replace(/[_-]/g, ' ').trim();

  for (const food of NUTRITION_DATABASE) {
    if (
      food.name.toLowerCase() === cleanLabel ||
      food.aliases.some((a) => a.toLowerCase() === cleanLabel)
    ) {
      return { item: food, confidenceScore: 0.96 };
    }
  }

  for (const food of NUTRITION_DATABASE) {
    if (
      food.name.toLowerCase().includes(cleanLabel) ||
      cleanLabel.includes(food.name.toLowerCase()) ||
      food.aliases.some((a) => cleanLabel.includes(a) || a.includes(cleanLabel))
    ) {
      return { item: food, confidenceScore: 0.88 };
    }
  }

  const labelTokens = cleanLabel.split(/\s+/);
  let bestFood = NUTRITION_DATABASE[0];
  let maxMatchCount = 0;

  for (const food of NUTRITION_DATABASE) {
    let score = 0;
    const foodTokens = `${food.name} ${food.aliases.join(' ')}`.toLowerCase().split(/\s+/);
    for (const token of labelTokens) {
      if (token.length > 2 && foodTokens.includes(token)) {
        score++;
      }
    }
    if (score > maxMatchCount) {
      maxMatchCount = score;
      bestFood = food;
    }
  }

  return { item: bestFood, confidenceScore: maxMatchCount > 0 ? 0.72 : 0.45 };
}

module.exports = {
  calculateNutrition,
  calculateTotalNutrition,
  searchNutritionDatabase,
  findBestFoodMatch,
};

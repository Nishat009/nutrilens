// Drift check between the Mongoose models (runtime source of truth) and the reference SQL in
// database/schema.sql. Every model needs a table, and every top-level model field needs a column
// (snake_case), a column group with that prefix, a column per field of a nested object, or a child
// table for an embedded array.
// Runs without MongoDB as part of `npm run build`. Usage: node scripts/check-schema-docs.js
const fs = require('fs');
const path = require('path');

const TABLES = {
  User: 'users', Food: 'foods', Meal: 'meals', FoodScan: 'food_scans', LearnedFoodMatch: 'learned_food_matches',
  PlannedMeal: 'planned_meals', WeightLog: 'weight_logs', DietPlan: 'diet_plans', Vegetable: 'vegetables',
};
// Embedded arrays stored as child tables in the SQL view.
const CHILD_TABLES = { 'Meal.items': 'meal_items', 'FoodScan.detectedItems': 'scan_items' };
const SKIP = new Set(['_id', '__v']);

// caloriesPer100g -> calories_per_100g, vitaminAIU -> vitamin_a_iu, vitaminCMg -> vitamin_c_mg
const snake = (name) => name
  .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
  .replace(/([a-z])([A-Z0-9])/g, '$1_$2')
  .replace(/([A-Z])([A-Z])(?=[A-Z]*$)/, '$1_$2')
  .toLowerCase();

const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
const columns = {};
for (const match of sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\);/g)) {
  columns[match[1]] = new Set(
    match[2].split('\n').map((line) => line.trim().split(/\s+/)[0]).filter((word) => /^[a-z_0-9]+$/.test(word))
  );
}

const problems = [];
for (const [model, table] of Object.entries(TABLES)) {
  const cols = columns[table];
  if (!cols) {
    problems.push(`${model}: table "${table}" is missing from database/schema.sql`);
    continue;
  }
  const schema = require(path.join(__dirname, '..', 'src', 'models', model)).schema;
  const paths = Object.keys(schema.paths);
  const fields = new Set(paths.map((p) => p.split('.')[0]).filter((p) => !SKIP.has(p)));
  for (const field of fields) {
    const column = snake(field);
    const child = CHILD_TABLES[`${model}.${field}`];
    const leaves = paths.filter((p) => p.startsWith(`${field}.`)).map((p) => snake(p.split('.').pop()));
    const documented = cols.has(column) || [...cols].some((c) => c.startsWith(`${column}_`)) || (child && columns[child])
      || (leaves.length > 0 && leaves.every((leaf) => cols.has(leaf)));
    if (!documented) problems.push(`${model}.${field}: no column "${column}" in table "${table}"`);
  }
}

if (problems.length) {
  console.error('database/schema.sql is out of step with server/src/models:');
  problems.forEach((problem) => console.error(`  - ${problem}`));
  console.error('Update database/schema.sql and database/README.md (see CLAUDE.md).');
  process.exit(1);
}
console.log(`Schema docs check passed: ${Object.keys(TABLES).length} models match database/schema.sql.`);

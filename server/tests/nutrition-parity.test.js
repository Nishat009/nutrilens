// The web scanner (web/src/services/nutrition-engine.ts) and the API (src/services/nutrition-engine.js)
// share one food database (src/nutrition/nutrition-database.json) but each has its own copy of the
// matching and macro logic. This test runs both on the same inputs and fails if they disagree.
// Needs web/node_modules (TypeScript); skipped with a note when the web app is not installed.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const WEB_SRC = path.join(__dirname, '..', '..', 'web', 'src');
let ts;
try {
  ts = require(path.join(__dirname, '..', '..', 'web', 'node_modules', 'typescript'));
} catch {
  console.log('Nutrition parity: skipped (run npm install in web/ first).');
  process.exit(0);
}

// Load a web .ts module (and the .ts files it imports) as CommonJS.
const loadTs = (file) => {
  const cached = Module._cache[file];
  if (cached) return cached.exports;
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const mod = new Module(file);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  const baseRequire = mod.require.bind(mod);
  mod.require = (request) => {
    const ts = request.startsWith('.') && path.resolve(path.dirname(file), `${request}.ts`);
    return ts && fs.existsSync(ts) ? loadTs(ts) : baseRequire(request);
  };
  Module._cache[file] = mod;
  mod._compile(outputText, file);
  return mod.exports;
};

const web = loadTs(path.join(WEB_SRC, 'services', 'nutrition-engine.ts'));
const api = require('../src/services/nutrition-engine');
const { NUTRITION_DATABASE } = require('../src/data/nutrition-database');
const webDb = loadTs(path.join(WEB_SRC, 'data', 'nutrition-database.ts')).NUTRITION_DATABASE;

let checks = 0;
const same = (actual, expected, label) => {
  assert.deepStrictEqual(actual, expected, label);
  checks += 1;
};

same(webDb.map((food) => food.id), NUTRITION_DATABASE.map((food) => food.id), 'web and API read the same food list');

const labels = [
  ...NUTRITION_DATABASE.flatMap((food) => [food.name, food.englishName, food.bengaliName, ...food.aliases]).filter(Boolean),
  'fried_rice', 'green-salad', 'grilled chicken breast', 'unknown dish xyz', 'red curry with rice', '',
];
for (const label of labels) {
  const w = web.findBestFoodMatch(label);
  const a = api.findBestFoodMatch(label);
  same({ id: w.item.id, score: w.confidenceScore }, { id: a.item.id, score: a.confidenceScore }, `findBestFoodMatch("${label}")`);
}

const categories = [undefined, ...new Set(NUTRITION_DATABASE.map((food) => food.category))];
for (const query of ['', 'rice', 'apple', 'green', 'shak', 'fish', 'leafy', 'zzz']) {
  for (const category of categories) {
    if (!query && !category) continue;
    same(
      web.searchNutritionDatabase(query, category).map((food) => food.id),
      api.searchNutritionDatabase(query, category).map((food) => food.id),
      `searchNutritionDatabase("${query}", ${category})`,
    );
  }
}

for (const food of NUTRITION_DATABASE) {
  for (const grams of [0, 37, 100, 250, -5]) {
    same(web.calculateNutrition(food, grams), api.calculateNutrition(food, grams), `calculateNutrition(${food.id}, ${grams})`);
  }
}
const items = NUTRITION_DATABASE.slice(0, 12).map((food) => api.calculateNutrition(food, 150));
same(web.calculateTotalNutrition(items), api.calculateTotalNutrition(items), 'calculateTotalNutrition');

console.log(`Nutrition parity: ${checks} checks passed (web scanner and API agree on ${NUTRITION_DATABASE.length} foods).`);

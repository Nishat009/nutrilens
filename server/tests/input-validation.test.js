// Request-body validation for POST /api/meals and POST /api/auth/register, with the model writes
// stubbed so no database is needed. Usage: npm run test:unit
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Meal = require('../src/models/Meal');
const User = require('../src/models/User');
const { createMeal } = require('../src/controllers/meal.controller');
const { register } = require('../src/controllers/auth.controller');

process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

let created;
Meal.create = async (doc) => { created = doc; return doc; };
User.create = async (doc) => { created = doc; return { ...doc, _id: '64b000000000000000000009', role: 'user', tokenVersion: 0 }; };

async function call(handler, body) {
  created = undefined;
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
  await handler({ body, user: { _id: '64b000000000000000000001' } }, res);
  return res;
}

const apple = { foodName: 'Apple', quantity: 150, unit: 'g', calories: 78, protein: 0.4, carbs: 21, fat: 0.3 };

(async () => {
  // Totals always come from the items; client totals are ignored.
  let res = await call(createMeal, { type: 'snack', items: [apple, apple], totalCalories: 9999, totalProtein: 500 });
  assert.equal(res.statusCode, 200);
  assert.equal(created.totalCalories, 156);
  assert.equal(created.totalProtein, 0.8);
  res = await call(createMeal, { totalCalories: 400 });
  assert.equal(res.statusCode, 200);
  assert.equal(created.totalCalories, 0);

  // Only whitelisted item fields are stored.
  await call(createMeal, { items: [{ ...apple, _id: 'x', userId: 'someone-else', extra: { $gt: 1 } }] });
  assert.deepEqual(Object.keys(created.items[0]).sort(), ['calories', 'carbs', 'confidence', 'fat', 'fiber', 'foodName', 'protein', 'quantity', 'unit']);

  // Malformed input is rejected with 422 and nothing is written.
  const bad = [
    { items: 'not-an-array' },
    { items: { 0: apple } },
    { items: Array.from({ length: 51 }, () => apple) },
    { items: [null] },
    { items: [{ ...apple, foodName: '' }] },
    { items: [{ ...apple, calories: { $gt: 0 } }] },
    { items: [{ ...apple, protein: 'abc' }] },
    { type: 'brunch' },
    { date: { $ne: null } },
    { date: '05/11/2026' },
    { time: 1200 },
    { notes: ['x'] },
  ];
  for (const body of bad) {
    res = await call(createMeal, body);
    assert.equal(res.statusCode, 422, `expected 422 for ${JSON.stringify(body).slice(0, 80)}`);
    assert.equal(created, undefined);
  }

  // Values are bounded.
  await call(createMeal, { items: [{ ...apple, calories: 1e9, quantity: -5, confidence: 7 }] });
  assert.equal(created.items[0].calories, 10000);
  assert.equal(created.items[0].quantity, 0);
  assert.equal(created.items[0].confidence, 1);

  // Registration: profile fields must be primitives of the right type.
  const signUp = { name: 'Test', email: 'test@example.com', password: crypto.randomBytes(12).toString('base64url') };
  res = await call(register, { ...signUp, heightCm: '172', weightKg: 70, gender: 'female', dob: '1995-02-03', role: 'admin' });
  assert.equal(res.statusCode, 200);
  assert.equal(created.heightCm, 172);
  assert.equal(created.role, undefined, 'role must never be accepted at sign-up');
  for (const extra of [{ heightCm: { $gt: 0 } }, { heightCm: 5000 }, { weightKg: 'heavy' }, { gender: { $ne: null } }, { dob: 'yesterday' }, { activityLevel: ['x'] }]) {
    res = await call(register, { ...signUp, ...extra });
    assert.equal(res.statusCode, 422, `expected 422 for ${JSON.stringify(extra)}`);
    assert.equal(created, undefined);
  }

  console.log(`Input validation test passed: meal items, totals and registration fields (${bad.length + 12} cases).`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

// End-to-end smoke test of every authenticated module against a running API + seeded MongoDB.
// Usage: npm run test:e2e   (API_URL defaults to http://localhost:$PORT)
require('dotenv').config();
const assert = require('node:assert/strict');

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const results = [];

async function call(method, path, { token, body, expect = 200 } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const ok = res.status === expect && json.success !== false === (expect < 400);
  results.push({ ok, label: `${method} ${path} -> ${res.status}${ok ? '' : ` (expected ${expect}) ${JSON.stringify(json.errors || '')}`}` });
  return json;
}

async function main() {
  const health = await call('GET', '/api/health');
  assert.equal(health.database?.connected, true, 'API is up but MongoDB is not connected — see HowToSetup.md');

  const login = await call('POST', '/api/auth/login', { body: { email: 'demo.member@nutrilens.app', password: process.env.DEMO_MEMBER_PASSWORD || 'Demo@1234' } });
  const token = login.data?.token;
  assert.ok(token, 'member login failed — did you run "npm run seed"?');
  await call('POST', '/api/auth/login', { body: { email: 'demo.member@nutrilens.app', password: 'wrong-password' }, expect: 422 });
  await call('GET', '/api/auth/me', { token });
  await call('GET', '/api/auth/me', { expect: 422 });
  // Member-only routes reject anonymous callers; profiles can only be changed by their owner.
  await call('POST', '/api/vegetables/match', { body: { query: 'tomato' }, expect: 422 });
  await call('POST', '/api/vegetables/tomato/calculate', { body: { quantityGrams: 100 }, expect: 422 });
  await call('GET', '/api/scan/learned', { expect: 422 });
  await call('GET', '/api/diets/recommendations', { expect: 422 });
  await call('PUT', '/api/users/000000000000000000000000', { token, body: { name: 'Not mine' }, expect: 422 });
  await call('PUT', '/api/users/000000000000000000000000/goal', { token, body: { targetCalories: 1 }, expect: 422 });
  // Search text is matched literally, so regex metacharacters cannot break the query.
  await call('GET', '/api/foods?search=(((');

  const email = `e2e-${Date.now()}@example.com`;
  const reg = await call('POST', '/api/auth/register', { body: { name: 'E2E Tester', email, password: 'E2e@12345' } });
  const t2 = reg.data?.token;
  await call('GET', '/api/users/current', { token: t2 });
  await call('PUT', '/api/users/current', { token: t2, body: { name: 'E2E Renamed' } });

  const me = login.data.user;
  await call('GET', '/api/users/current', { token });
  await call('GET', '/api/progress', { token });
  await call('GET', '/api/progress/weight', { token });
  await call('POST', '/api/progress/weight', { token, body: { weightKg: 74.2, date: new Date().toISOString() } });
  await call('GET', '/api/progress/nutrition', { token });
  await call('GET', '/api/meals', { token });
  const foods = await call('GET', '/api/foods', { token });
  const food = (foods.data || foods.result || [])[0];
  const meal = await call('POST', '/api/meals', {
    token,
    body: { name: 'E2E lunch', mealType: 'lunch', loggedAt: new Date().toISOString(), items: [], totalCalories: 400, totalProtein: 30, totalCarbs: 40, totalFat: 10 },
  });
  const mealId = meal.data?._id || meal.data?.id || meal.result?._id;
  if (mealId) {
    await call('GET', `/api/meals/${mealId}`, { token });
    await call('DELETE', `/api/meals/${mealId}`, { token });
  }
  await call('GET', '/api/vegetables', { token });
  await call('GET', '/api/vegetables/categories', { token });
  await call('GET', '/api/diets', { token });
  await call('GET', '/api/diets/recommendations', { token });
  await call('GET', '/api/planner', { token });
  await call('GET', '/api/scans', { token });
  await call('GET', '/api/scan/learned', { token });

  const admin = await call('POST', '/api/auth/login', { body: { email: 'demo.admin@nutrilens.app', password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@1234' } });
  const at = admin.data?.token;
  for (const p of ['overview', 'users', 'scans', 'diets', 'catalog']) await call('GET', `/api/admin/${p}`, { token: at });
  await call('GET', '/api/admin/overview', { token, expect: 422 });

  void food; void me;
}

main()
  .catch((e) => { results.push({ ok: false, label: `FATAL ${e.message}` }); })
  .finally(() => {
    results.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}`));
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} checks passed`);
    process.exit(failed ? 1 : 0);
  });

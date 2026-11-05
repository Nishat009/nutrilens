// End-to-end smoke test of every authenticated module against a running API + seeded MongoDB.
// Usage: npm run test:e2e   (API_URL defaults to http://localhost:$PORT)
require('dotenv').config();
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

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

  // Demo accounts are reached through the one-click endpoint, so no password lives in this script.
  const login = await call('POST', '/api/auth/demo-login', { body: { role: 'user' } });
  const token = login.data?.token;
  assert.ok(token, 'demo member login failed — is DEMO_MODE on and did you run "npm run seed"?');
  await call('POST', '/api/auth/login', { body: { email: 'demo.member@nutrilens.app', password: crypto.randomBytes(12).toString('base64url') }, expect: 422 });
  await call('GET', '/api/auth/me', { token });
  await call('GET', '/api/auth/me', { expect: 401 });
  await call('POST', '/api/auth/login', { body: { email: { $ne: null }, password: 'x' }, expect: 422 });
  // Member-only routes reject anonymous callers; profiles can only be changed by their owner.
  await call('POST', '/api/vegetables/match', { body: { query: 'tomato' }, expect: 401 });
  await call('POST', '/api/vegetables/tomato/calculate', { body: { quantityGrams: 100 }, expect: 401 });
  await call('GET', '/api/scans/learned', { expect: 401 });
  await call('GET', '/api/diets/recommendations', { expect: 401 });
  await call('PUT', '/api/users/000000000000000000000000', { token, body: { name: 'Not mine' }, expect: 403 });
  await call('PUT', '/api/users/000000000000000000000000/goal', { token, body: { targetCalories: 1 }, expect: 403 });
  // Search text is matched literally, so regex metacharacters cannot break the query.
  await call('GET', '/api/foods?search=(((');

  const email = `e2e-${Date.now()}@example.com`;
  const reg = await call('POST', '/api/auth/register', { body: { name: 'E2E Tester', email, password: crypto.randomBytes(12).toString('base64url') } });
  await call('POST', '/api/auth/register', { body: { name: 'E2E Tester', email: email.toUpperCase(), password: crypto.randomBytes(12).toString('base64url') }, expect: 422 });
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
    // Cross-user access: another member can neither read nor delete this meal.
    await call('GET', `/api/meals/${mealId}`, { token: t2, expect: 422 });
    await call('DELETE', `/api/meals/${mealId}`, { token: t2, expect: 422 });
    await call('GET', `/api/meals/${mealId}`, { token });
    await call('DELETE', `/api/meals/${mealId}`, { token });
  }
  const slot = await call('POST', '/api/planner', { token, body: { dayOfWeek: 1, foodName: 'E2E oats' } });
  const slotId = slot.data?._id;
  if (slotId) {
    await call('DELETE', `/api/planner/${slotId}`, { token: t2, expect: 422 });
    await call('DELETE', `/api/planner/${slotId}`, { token });
  }
  await call('GET', '/api/scans?page=1&limit=5', { token });
  await call('GET', '/api/scans/000000000000000000000000', { token: t2, expect: 422 });
  await call('POST', '/api/foods', { token, body: { name: 'Not allowed' }, expect: 403 });
  await call('GET', '/api/no-such-route', { expect: 404 });
  await call('GET', '/api/vegetables', { token });
  await call('GET', '/api/vegetables/categories', { token });
  await call('GET', '/api/diets', { token });
  await call('GET', '/api/diets/recommendations', { token });
  await call('GET', '/api/planner', { token });
  await call('GET', '/api/scans', { token });
  await call('GET', '/api/scans/learned', { token });

  const admin = await call('POST', '/api/auth/demo-login', { body: { role: 'admin' } });
  const at = admin.data?.token;
  for (const p of ['overview', 'users', 'scans', 'diets', 'catalog']) await call('GET', `/api/admin/${p}`, { token: at });
  await call('GET', '/api/admin/overview', { token, expect: 403 });
  await call('DELETE', '/api/admin/users/000000000000000000000000', { token: at, expect: 403 });
  await call('PATCH', '/api/admin/users/000000000000000000000000', { token: at, body: { role: 'admin' }, expect: 403 });
  await call('PATCH', '/api/admin/vegetables/000000000000000000000000', { token: at, body: {}, expect: 403 });

  // Signing out everywhere revokes tokens issued before it.
  await call('POST', '/api/auth/logout-all', { token: t2 });
  await call('GET', '/api/auth/me', { token: t2, expect: 401 });

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

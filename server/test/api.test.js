// API integration tests. Run with `npm test` (needs a reachable MongoDB).
// Uses TEST_MONGODB_URI (default: local nutrilens_test database) and drops it
// before and after the run, so it refuses to touch a database whose name
// doesn't contain "test".
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.ADMIN_EMAILS = 'admin@example.com';

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');

const mailer = require('../src/utils/mailer');
const app = require('../src/app');
const { rateLimit } = require('../src/middleware/rate-limit');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/nutrilens_test';

let server;
let baseUrl;
const sentMail = [];

async function api(method, path, { body, token, rawBody } = {}) {
  const headers = {};
  if (body !== undefined || rawBody !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(baseUrl + path, {
    method,
    headers,
    body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, body: json };
}

async function registerUser(email, extra = {}) {
  const res = await api('POST', '/api/auth/register', {
    body: { name: 'Test User', email, password: 'correct-horse-1', ...extra },
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return { token: res.body.data.token, user: res.body.data.user };
}

before(async () => {
  const dbName = new URL(TEST_DB_URI.replace('mongodb+srv://', 'mongodb://')).pathname.slice(1);
  if (!dbName.toLowerCase().includes('test')) {
    throw new Error(`Refusing to run tests against database "${dbName}" (name must contain "test")`);
  }
  await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.dropDatabase();
  await mongoose.model('User').syncIndexes();

  // Capture outgoing emails instead of sending/logging them.
  mailer.sendMail = async (message) => {
    sentMail.push(message);
  };

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (server) await new Promise((resolve) => server.close(resolve));
});

describe('general', () => {
  test('health check responds', async () => {
    const res = await api('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.database.connected, true);
  });

  test('unknown route is 404', async () => {
    const res = await api('GET', '/api/does-not-exist');
    assert.equal(res.status, 404);
  });

  test('malformed JSON is 400', async () => {
    const res = await api('POST', '/api/auth/login', { rawBody: '{"email":' });
    assert.equal(res.status, 400);
  });
});

describe('auth', () => {
  test('register validates input', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'A', email: 'short@example.com', password: 'short' },
    });
    assert.equal(res.status, 422);
  });

  test('register, duplicate, login, me', async () => {
    const { token, user } = await registerUser('auth@example.com');
    assert.ok(token);
    assert.equal(user.password, undefined);
    // No invented biometrics on a fresh account
    assert.equal(user.heightCm, undefined);
    assert.equal(user.weightKg, undefined);

    const duplicate = await api('POST', '/api/auth/register', {
      body: { name: 'Again', email: 'AUTH@example.com', password: 'correct-horse-1' },
    });
    assert.equal(duplicate.status, 409);

    const wrong = await api('POST', '/api/auth/login', {
      body: { email: 'auth@example.com', password: 'wrong-password' },
    });
    assert.equal(wrong.status, 401);

    const login = await api('POST', '/api/auth/login', {
      body: { email: 'Auth@Example.com', password: 'correct-horse-1' },
    });
    assert.equal(login.status, 200);

    const me = await api('GET', '/api/auth/me', { token: login.body.data.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.email, 'auth@example.com');
    assert.equal(me.body.data.password, undefined);
  });

  test('login rejects operator injection in email', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: { $ne: null }, password: 'anything' },
    });
    assert.equal(res.status, 422);
  });

  test('missing or bad token is 401', async () => {
    assert.equal((await api('GET', '/api/auth/me')).status, 401);
    assert.equal((await api('GET', '/api/auth/me', { token: 'not.a.token' })).status, 401);
  });

  test('protected routes require a token', async () => {
    for (const path of ['/api/meals', '/api/planner', '/api/progress/weight', '/api/scans', '/api/users/current']) {
      const res = await api('GET', path);
      assert.equal(res.status, 401, `${path} should require auth`);
    }
  });
});

describe('password reset', () => {
  test('unknown email gets the same generic response', async () => {
    const before = sentMail.length;
    const res = await api('POST', '/api/auth/forgot-password', { body: { email: 'nobody@example.com' } });
    assert.equal(res.status, 200);
    assert.equal(sentMail.length, before);
  });

  test('full reset flow', async () => {
    await registerUser('reset@example.com');
    const res = await api('POST', '/api/auth/forgot-password', { body: { email: 'reset@example.com' } });
    assert.equal(res.status, 200);

    const mail = sentMail.find((m) => m.to === 'reset@example.com');
    assert.ok(mail, 'reset email should be sent');
    const token = mail.text.match(/token=([a-f0-9]+)/)[1];

    const reset = await api('POST', '/api/auth/reset-password', {
      body: { token, password: 'brand-new-pass-2' },
    });
    assert.equal(reset.status, 200);

    const oldLogin = await api('POST', '/api/auth/login', {
      body: { email: 'reset@example.com', password: 'correct-horse-1' },
    });
    assert.equal(oldLogin.status, 401);
    const newLogin = await api('POST', '/api/auth/login', {
      body: { email: 'reset@example.com', password: 'brand-new-pass-2' },
    });
    assert.equal(newLogin.status, 200);

    const reuse = await api('POST', '/api/auth/reset-password', {
      body: { token, password: 'another-pass-3' },
    });
    assert.equal(reuse.status, 400, 'token must be single-use');
  });
});

describe('users', () => {
  test('profile update persists and cannot touch other users', async () => {
    const { token } = await registerUser('profile@example.com');
    const update = await api('PUT', '/api/users/current', {
      token,
      body: { weightKg: 81, heightCm: 176, password: 'ignored-field' },
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.data.weightKg, 81);

    const login = await api('POST', '/api/auth/login', {
      body: { email: 'profile@example.com', password: 'correct-horse-1' },
    });
    assert.equal(login.status, 200, 'password must not be changeable via profile update');

    const other = await api('GET', `/api/users/${new mongoose.Types.ObjectId()}`, { token });
    assert.equal(other.status, 404);
  });

  test('changing email to one already in use is 409', async () => {
    await registerUser('taken@example.com');
    const { token } = await registerUser('mover@example.com');
    const res = await api('PUT', '/api/users/current', { token, body: { email: 'taken@example.com' } });
    assert.equal(res.status, 409);
  });
});

describe('meals', () => {
  test('CRUD is scoped to the signed-in user', async () => {
    const alice = await registerUser('alice@example.com');
    const bob = await registerUser('bob@example.com');

    const created = await api('POST', '/api/meals', {
      token: alice.token,
      body: {
        type: 'lunch',
        date: '2026-01-15',
        items: [{ foodName: 'Rice', quantity: 150, unit: 'g', calories: 195, protein: 4, carbs: 42, fat: 0.4 }],
      },
    });
    assert.equal(created.status, 200, JSON.stringify(created.body));
    const mealId = created.body.data._id;
    assert.equal(created.body.data.totalCalories, 195);

    const aliceMeals = await api('GET', '/api/meals?date=2026-01-15', { token: alice.token });
    assert.equal(aliceMeals.body.count, 1);

    const bobMeals = await api('GET', '/api/meals', { token: bob.token });
    assert.equal(bobMeals.body.count, 0, "Bob must not see Alice's meals");
    assert.equal((await api('GET', `/api/meals/${mealId}`, { token: bob.token })).status, 404);
    assert.equal((await api('DELETE', `/api/meals/${mealId}`, { token: bob.token })).status, 404);

    assert.equal((await api('GET', `/api/meals/${mealId}`, { token: alice.token })).status, 200);
    assert.equal((await api('DELETE', `/api/meals/${mealId}`, { token: alice.token })).status, 200);
    assert.equal((await api('DELETE', `/api/meals/${mealId}`, { token: alice.token })).status, 404);
  });

  test('invalid meal id is 422', async () => {
    const { token } = await registerUser('badid@example.com');
    assert.equal((await api('GET', '/api/meals/not-an-id', { token })).status, 422);
  });
});

describe('meal editing and validation', () => {
  test('PUT recalculates totals, is owner-scoped, and bad payloads are 422', async () => {
    const alice = await registerUser('edit-alice@example.com');
    const bob = await registerUser('edit-bob@example.com');
    const created = await api('POST', '/api/meals', {
      token: alice.token,
      body: { type: 'lunch', date: '2026-02-01', items: [{ foodName: 'Rice', quantity: 100, unit: 'g', calories: 130, protein: 3, carbs: 28, fat: 0.3 }] },
    });
    const id = created.body.data._id;

    const updated = await api('PUT', `/api/meals/${id}`, {
      token: alice.token,
      body: { type: 'dinner', items: [{ foodName: 'Rice', quantity: 200, unit: 'g', calories: 260, protein: 6, carbs: 56, fat: 0.6 }] },
    });
    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.data.type, 'dinner');
    assert.equal(updated.body.data.totalCalories, 260);

    assert.equal((await api('PUT', `/api/meals/${id}`, { token: bob.token, body: { type: 'snack' } })).status, 404);
    assert.equal((await api('PUT', `/api/meals/${id}`, { token: alice.token, body: { type: 'brunch' } })).status, 422);
    const negative = await api('POST', '/api/meals', {
      token: alice.token,
      body: { type: 'lunch', items: [{ foodName: 'X', quantity: 1, unit: 'g', calories: -5, protein: 0, carbs: 0, fat: 0 }] },
    });
    assert.equal(negative.status, 422);
  });
});

describe('account management', () => {
  test('change password requires the current password', async () => {
    const { token } = await registerUser('chpw@example.com');
    const wrong = await api('POST', '/api/auth/change-password', { token, body: { currentPassword: 'nope-nope-1', newPassword: 'brand-new-pass-1' } });
    assert.equal(wrong.status, 403);
    const short = await api('POST', '/api/auth/change-password', { token, body: { currentPassword: 'correct-horse-1', newPassword: 'short' } });
    assert.equal(short.status, 422);
    const ok = await api('POST', '/api/auth/change-password', { token, body: { currentPassword: 'correct-horse-1', newPassword: 'brand-new-pass-1' } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));

    assert.equal((await api('POST', '/api/auth/login', { body: { email: 'chpw@example.com', password: 'correct-horse-1' } })).status, 401);
    assert.equal((await api('POST', '/api/auth/login', { body: { email: 'chpw@example.com', password: 'brand-new-pass-1' } })).status, 200);
  });

  test('export returns own data and delete removes the account and its data', async () => {
    const { token } = await registerUser('gone@example.com');
    await api('POST', '/api/meals', {
      token,
      body: { type: 'lunch', date: '2026-02-02', items: [{ foodName: 'Dal', quantity: 100, unit: 'g', calories: 116, protein: 9, carbs: 20, fat: 0.4 }] },
    });

    const exported = await api('GET', '/api/users/current/export', { token });
    assert.equal(exported.status, 200);
    assert.equal(exported.body.data.meals.length, 1);
    assert.equal(exported.body.data.profile.password, undefined);

    assert.equal((await api('DELETE', '/api/users/current', { token, body: {} })).status, 422);
    assert.equal((await api('DELETE', '/api/users/current', { token, body: { password: 'wrong-password-1' } })).status, 403);
    assert.equal((await api('DELETE', '/api/users/current', { token, body: { password: 'correct-horse-1' } })).status, 200);

    assert.equal((await api('GET', '/api/auth/me', { token })).status, 401);
    assert.equal((await api('POST', '/api/auth/login', { body: { email: 'gone@example.com', password: 'correct-horse-1' } })).status, 401);
    assert.equal(await mongoose.model('Meal').countDocuments({ date: '2026-02-02' }), 0);
  });
});

describe('planner', () => {
  test('add, list, delete', async () => {
    const { token } = await registerUser('planner@example.com');
    const missing = await api('POST', '/api/planner', { token, body: { dayOfWeek: 1 } });
    assert.equal(missing.status, 422);

    const added = await api('POST', '/api/planner', {
      token,
      body: { dayOfWeek: 0, mealType: 'lunch', foodName: 'Dal + Rice', calories: 450 },
    });
    assert.equal(added.status, 200);

    const list = await api('GET', '/api/planner', { token });
    assert.equal(list.body.count, 1);

    const removed = await api('DELETE', `/api/planner/${added.body.data._id}`, { token });
    assert.equal(removed.status, 200);
  });
});

describe('progress', () => {
  test('weight log updates profile and nutrition history aggregates meals', async () => {
    const { token } = await registerUser('progress@example.com');
    const logged = await api('POST', '/api/progress/weight', { token, body: { weightKg: 77.5 } });
    assert.equal(logged.status, 200);

    const me = await api('GET', '/api/auth/me', { token });
    assert.equal(me.body.data.weightKg, 77.5);

    const today = new Date().toISOString().split('T')[0];
    await api('POST', '/api/meals', {
      token,
      body: { date: today, items: [{ foodName: 'Egg', quantity: 1, unit: 'pc', calories: 78, protein: 6, carbs: 0.6, fat: 5 }] },
    });
    const history = await api('GET', '/api/progress/nutrition?days=7', { token });
    assert.equal(history.status, 200);
    const day = history.body.data.find((d) => d.date === today);
    assert.equal(day.totalCalories, 78);

    const weights = await api('GET', '/api/progress/weight', { token });
    assert.equal(weights.body.count, 1);
  });
});

describe('scans', () => {
  test('save, list, fetch, evaluate', async () => {
    const { token } = await registerUser('scans@example.com');
    const saved = await api('POST', '/api/scans', {
      token,
      body: {
        imageUrl: 'data:image/png;base64,AAAA',
        totalCalories: 120,
        detectedItems: [{ name: 'Cucumber', confidence: 0.8, estimatedQuantity: 100, unit: 'g', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 }],
      },
    });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));

    const list = await api('GET', '/api/scans', { token });
    assert.equal(list.body.count, 1);
    assert.equal((await api('GET', `/api/scans/${saved.body.data._id}`, { token })).status, 200);

    const evaluation = await api('POST', '/api/scans/evaluate', { token, body: { foodName: 'white rice', portionG: 150 } });
    assert.equal(evaluation.status, 200);
    assert.ok(['SAFE', 'CAUTION', 'LIMIT', 'AVOID', 'PROFESSIONAL_REVIEW'].includes(evaluation.body.data.status));
  });
});

describe('diets', () => {
  test('catalog is the canonical 20 protocols', async () => {
    const res = await api('GET', '/api/diets');
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 20);
  });

  test('lookup by slug, unknown slug is 404', async () => {
    assert.equal((await api('GET', '/api/diets/dash-hypertension-cardio')).status, 200);
    assert.equal((await api('GET', '/api/diets/no-such-diet-xyz')).status, 404);
  });

  test('adopt applies targets and never returns the password hash', async () => {
    const { token } = await registerUser('adopt@example.com', {});
    await api('PUT', '/api/users/current', {
      token,
      body: { gender: 'male', heightCm: 175, weightKg: 80, dob: '1990-01-01', healthConditions: ['hypertension'] },
    });

    const adopted = await api('POST', '/api/diets/adopt', { token, body: { dietId: 'dash_cardio_care' } });
    assert.equal(adopted.status, 200);
    assert.equal(adopted.body.status, 'adopted');
    assert.equal(adopted.body.data.user.password, undefined);
    assert.equal(adopted.body.data.user.activeDietId, 'dash_cardio_care');

    const blocked = await api('POST', '/api/diets/adopt', { token, body: { dietId: 'pcos_hormone_balance' } });
    assert.equal(blocked.status, 200);
    assert.equal(blocked.body.canAdopt, false, 'female-only protocol must be blocked for a male profile');

    const unknown = await api('POST', '/api/diets/adopt', { token, body: { dietId: 'no-such-diet-xyz' } });
    assert.equal(unknown.status, 404);
  });

  test('kidney disease blocks high-protein adoption (conditions from onboarding)', async () => {
    const { token } = await registerUser('kidney@example.com');
    await api('PUT', '/api/users/current', { token, body: { gender: 'male', healthConditions: ['kidney_disease'] } });
    const res = await api('POST', '/api/diets/adopt', { token, body: { dietId: 'muscle_recomp' } });
    assert.equal(res.body.canAdopt, false);
    assert.equal(res.body.status, 'PROFESSIONAL_REVIEW');
  });

  test('recommendation uses the canonical catalog and respects sex eligibility', async () => {
    const { token } = await registerUser('recommend@example.com');
    const res = await api('POST', '/api/diets/recommend', {
      token,
      body: {
        gender: 'male',
        dob: '1992-03-10',
        heightCm: 172,
        weightKg: 82,
        activityLevel: 'lightly_active',
        primaryGoal: 'blood_pressure',
        healthConditions: ['hypertension'],
        foodPreferences: ['traditional_bangladeshi'],
        allergies: [],
      },
    });
    assert.equal(res.status, 200);
    const plan = res.body.data;
    assert.equal(plan.selectedDiet.id, 'dash_cardio_care');
    assert.equal(plan.sevenDayPlan.length, 7);
    assert.ok(!plan.topMatches.some((d) => d.id === 'pcos_hormone_balance'), 'no female-only protocols for a male user');

    const ranked = await api('GET', '/api/diets/recommendations', { token });
    assert.equal(ranked.status, 200);
    assert.ok(ranked.body.data.length > 0);
  });
});

describe('foods', () => {
  test('search treats regex characters literally', async () => {
    const res = await api('GET', '/api/foods?search=(');
    assert.equal(res.status, 200);
  });

  test('only admins can add foods', async () => {
    const food = { name: 'Test Food', category: 'Test', nutrition: { calories: 1, protein: 0, carbs: 0, fat: 0 } };
    assert.equal((await api('POST', '/api/foods', { body: food })).status, 401);

    const user = await registerUser('notadmin@example.com');
    assert.equal((await api('POST', '/api/foods', { token: user.token, body: food })).status, 403);

    const admin = await registerUser('admin@example.com');
    const created = await api('POST', '/api/foods', { token: admin.token, body: food });
    assert.equal(created.status, 200, JSON.stringify(created.body));
  });
});

describe('rate limiting', () => {
  test('blocks requests over the limit with 429', async () => {
    const limited = express();
    limited.get('/', rateLimit({ windowMs: 60_000, max: 2 }), (req, res) => res.json({ ok: true }));
    const limitedServer = await new Promise((resolve) => {
      const s = limited.listen(0, () => resolve(s));
    });
    const url = `http://127.0.0.1:${limitedServer.address().port}/`;
    try {
      assert.equal((await fetch(url)).status, 200);
      assert.equal((await fetch(url)).status, 200);
      const blocked = await fetch(url);
      assert.equal(blocked.status, 429);
      assert.ok(blocked.headers.get('retry-after'));
    } finally {
      await new Promise((resolve) => limitedServer.close(resolve));
    }
  });
});

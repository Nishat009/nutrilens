// Login token and guard behaviour, with the User lookup stubbed so no database is needed.
// Usage: npm run test:unit
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const User = require('../src/models/User');
const { createToken, requireAuth, requireAdmin, requireSelf, blockDemoWrites } = require('../src/middleware/auth');
const { sumNutrients } = require('../src/utils/nutrients');

// Random per run, so no signing-secret string is committed.
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const member = { _id: '64b000000000000000000001', role: 'user', tokenVersion: 0, isDemo: false };
User.findById = async (id) => (id === member._id ? member : null);

function run(middleware, req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body, next: false }); return this; },
    };
    Promise.resolve(middleware(req, res, () => resolve({ status: 200, next: true }))).catch(() => {});
  });
}
const bearer = (token) => ({ headers: { authorization: `Bearer ${token}` }, params: {} });

async function main() {
  const token = createToken(member);
  const [header, payload, signature] = token.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  assert.equal(claims.exp - claims.iat, 60 * 60 * 24 * 7, 'default lifetime is 7 days');

  assert.equal((await run(requireAuth, bearer(token))).next, true, 'valid token passes');
  assert.equal((await run(requireAuth, { headers: {} })).status, 401, 'missing token');
  assert.equal((await run(requireAuth, bearer(`${header}.${payload}.short`))).status, 401, 'shorter signature is rejected, not thrown');
  assert.equal((await run(requireAuth, bearer(`${header}.${payload}.${signature}x`))).status, 401, 'longer signature');
  const forged = Buffer.from(JSON.stringify({ ...claims, sub: '64b000000000000000000002' })).toString('base64url');
  assert.equal((await run(requireAuth, bearer(`${header}.${forged}.${signature}`))).status, 401, 'tampered payload');
  const expired = Buffer.from(JSON.stringify({ ...claims, exp: 1 })).toString('base64url');
  assert.equal((await run(requireAuth, bearer(`${header}.${expired}.${signature}`))).status, 401, 'expired / re-signed payload');

  member.tokenVersion = 1; // POST /api/auth/logout-all
  assert.equal((await run(requireAuth, bearer(token))).status, 401, 'token issued before logout-all is revoked');
  assert.equal((await run(requireAuth, bearer(createToken(member)))).next, true, 'new token works');

  assert.equal((await run(requireAdmin, { user: member })).status, 403, 'member is not admin');
  assert.equal((await run(requireAdmin, { user: { role: 'admin' } })).next, true, 'admin passes');
  assert.equal((await run(blockDemoWrites, { user: { role: 'admin', isDemo: true } })).status, 403, 'demo admin cannot write');
  assert.equal((await run(requireSelf, { user: member, params: { id: 'current' } })).next, true, 'own record');
  assert.equal((await run(requireSelf, { user: member, params: { id: member._id } })).next, true, 'own id');
  assert.equal((await run(requireSelf, { user: member, params: { id: '64b000000000000000000002' } })).status, 403, 'other member');

  assert.deepEqual(sumNutrients([{ calories: 100, protein: 5 }, { calories: 50, fat: 2, fiber: '1' }, null]),
    { calories: 150, protein: 5, carbs: 0, fat: 2, fiber: 1 });

  console.log('Auth token and guard tests passed.');
}

main().catch((error) => { console.error(error); process.exit(1); });

// Checks a deployed NutriLens: API host up, MongoDB connected, both demo logins return a token.
// Usage: npm run verify:live -- https://your-app.vercel.app   (or set LIVE_URL)
const { requestJson } = require('./lib/http-helpers');

const BASE = (process.argv[2] || process.env.LIVE_URL || '').replace(/\/$/, '');

// The one-click demo endpoint needs no password, so none is stored in this script.
const DEMO_ROLES = ['user', 'admin'];

const request = (method, path, body, token) => requestJson(BASE, method, path, { body, token });

async function main() {
  if (!BASE) throw new Error('Pass the live URL: npm run verify:live -- https://your-app.vercel.app');
  let failed = false;
  const check = (ok, label) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
    if (!ok) failed = true;
  };

  const health = await request('GET', '/api/health');
  check(health.status === 200 && health.json, `GET /api/health -> ${health.status} (API host reachable through /api)`);
  check(health.json?.database?.connected === true, 'MongoDB connected');

  for (const role of DEMO_ROLES) {
    const res = await request('POST', '/api/auth/demo-login', { role });
    const token = res.json?.data?.token;
    check(res.status === 200 && Boolean(token) && res.json.data.user?.role === role, `POST /api/auth/demo-login (${role}) -> ${res.status}, token returned`);
    if (!token) continue;
    const me = await request('GET', '/api/auth/me', undefined, token);
    check(me.status === 200, `GET /api/auth/me with the ${role} demo token -> ${me.status}`);
  }

  console.log(`\n${BASE}: ${failed ? 'NOT verified' : 'verified'} (${new Date().toISOString()})`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`FAIL  ${error.message}`);
  process.exitCode = 1;
});

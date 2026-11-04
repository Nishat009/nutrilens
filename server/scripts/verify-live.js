// Checks a deployed NutriLens: API host up, MongoDB connected, both demo logins return a token.
// Usage: npm run verify:live -- https://your-app.vercel.app   (or set LIVE_URL)
const BASE = (process.argv[2] || process.env.LIVE_URL || '').replace(/\/$/, '');

const DEMO_LOGINS = [
  { email: 'demo.member@nutrilens.app', password: process.env.DEMO_MEMBER_PASSWORD || 'Demo@1234' },
  { email: 'demo.admin@nutrilens.app', password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@1234' },
];

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

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

  for (const login of DEMO_LOGINS) {
    const res = await request('POST', '/api/auth/login', login);
    check(res.status === 200 && Boolean(res.json?.data?.token), `POST /api/auth/login ${login.email} -> ${res.status}, token returned`);
  }

  console.log(`\n${BASE}: ${failed ? 'NOT verified' : 'verified'} (${new Date().toISOString()})`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`FAIL  ${error.message}`);
  process.exitCode = 1;
});

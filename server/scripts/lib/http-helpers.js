// Helpers shared by the scripts in server/scripts (e2e-smoke, verify-live, test-user-persistence).
const crypto = require('node:crypto');

// Generated per run so no password-like literal is committed.
const randomPassword = () => crypto.randomBytes(12).toString('base64url');

// JSON request against the API. Returns { status, json } (json is null when the body is not JSON).
async function requestJson(base, method, path, { body, token } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

module.exports = { randomPassword, requestJson };

// Deployment settings read from the environment, with their defaults in one place.
// Documented in server/.env.example.

const isProduction = () => process.env.NODE_ENV === 'production';

const parseList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);

// Browsers normally reach the API through the Next.js /api rewrite (same origin, no CORS needed).
// CORS_ORIGINS lists the web origins allowed to call the API directly (NEXT_PUBLIC_API_URL set).
// Unset: the local web app in development; no cross-origin access in production.
const DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOrigins = () => {
  const configured = parseList(process.env.CORS_ORIGINS);
  if (configured.length) return configured;
  return isProduction() ? [] : DEV_ORIGINS;
};

// JSON body limit. Scan photos are downscaled in the browser, so a few MB is plenty.
const BODY_LIMIT = process.env.BODY_LIMIT || '5mb';

// Largest scan photo (base64 data URL length) stored with a scan.
const MAX_SCAN_IMAGE_BYTES = Number(process.env.MAX_SCAN_IMAGE_BYTES) || 3 * 1024 * 1024;

// Login token lifetime; defaults to 7 days.
const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS) || 60 * 60 * 24 * 7;

const DB_UNAVAILABLE_MESSAGE =
  'Database unavailable: MongoDB is not connected. Install and start MongoDB, set MONGODB_URI in server/.env, run "npm run seed", then restart the API. See HowToSetup.md.';

module.exports = {
  isProduction,
  corsOrigins,
  BODY_LIMIT,
  MAX_SCAN_IMAGE_BYTES,
  TOKEN_TTL_SECONDS,
  DB_UNAVAILABLE_MESSAGE,
};

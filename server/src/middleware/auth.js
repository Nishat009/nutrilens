const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendError, sendUnexpectedError } = require('../utils/http');

const DEV_SECRET = 'nutrilens-development-secret-change-me';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('⚠️ JWT_SECRET is not set; using an insecure development secret.');
}

const getSecret = () => process.env.JWT_SECRET || DEV_SECRET;

function createToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId.toString(), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })).toString('base64url');
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', getSecret()).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(crypto.createHmac('sha256', getSecret()).update(unsigned).digest('base64url'));
  const actual = Buffer.from(parts[2]);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new Error('Invalid token');
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid token');
  }
  if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}

async function requireAuth(req, res, next) {
  let payload;
  try {
    const authorization = req.headers.authorization || '';
    if (!authorization.startsWith('Bearer ')) throw new Error('Authentication required');
    payload = verifyToken(authorization.slice(7));
    if (!mongoose.Types.ObjectId.isValid(payload.sub)) throw new Error('Invalid token');
  } catch (error) {
    return sendError(res, 401, error.message || 'Authentication required');
  }

  try {
    // The password hash is never loaded here, so it can't leak through req.user.
    const user = await User.findById(payload.sub);
    if (!user) return sendError(res, 401, 'User account not found');
    req.user = user;
    next();
  } catch (error) {
    // A database failure is not an auth failure; don't make the client log out.
    return sendUnexpectedError(res, error, 'Could not verify your session');
  }
}

// Use after requireAuth. Admins are listed in ADMIN_EMAILS (comma-separated).
function requireAdmin(req, res, next) {
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!req.user || !admins.includes(String(req.user.email).toLowerCase())) {
    return sendError(res, 403, 'Admin access required');
  }
  next();
}

module.exports = { createToken, requireAuth, requireAdmin };

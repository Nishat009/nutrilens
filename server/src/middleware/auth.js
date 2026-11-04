const crypto = require('crypto');
const User = require('../models/User');

// Without JWT_SECRET (local development only) a random per-process secret is used, so no
// shared fallback key ships in the repo; dev logins reset when the server restarts.
let devSecret = null;
const getSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set in production');
  if (!devSecret) {
    devSecret = crypto.randomBytes(48).toString('hex');
    console.warn('JWT_SECRET is not set; using a random development secret (logins reset on restart).');
  }
  return devSecret;
};

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
  const expected = crypto.createHmac('sha256', getSecret()).update(unsigned).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected))) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    if (!authorization.startsWith('Bearer ')) throw new Error('Authentication required');
    const payload = verifyToken(authorization.slice(7));
    const user = await User.findById(payload.sub).select('+password');
    if (!user) throw new Error('User account not found');
    req.user = user;
    next();
  } catch (error) {
    res.status(422).json({ success: false, code: 422, errors: [error.message || 'Authentication required'] });
  }
}

// Use after requireAuth.
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(422).json({ success: false, code: 422, errors: ['Admin access required'] });
  }
  next();
}

// Use after requireAuth on /:id routes: members may only read or change their own record
// (`:id` is `current` or the caller's own id), so ownership is enforced before any handler runs.
function requireSelf(req, res, next) {
  const { id } = req.params;
  if (id !== 'current' && id !== String(req.user?._id)) {
    return res.status(422).json({ success: false, code: 422, errors: ['User not found'] });
  }
  next();
}

// The demo admin is shared by every visitor, so it can browse but not change data.
function blockDemoWrites(req, res, next) {
  if (req.user?.isDemo) {
    return res.status(422).json({
      success: false,
      code: 422,
      errors: ['This action is disabled for the shared demo admin account'],
    });
  }
  next();
}

module.exports = { createToken, requireAuth, requireAdmin, requireSelf, blockDemoWrites };

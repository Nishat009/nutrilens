const crypto = require('crypto');
const User = require('../models/User');
const { TOKEN_TTL_SECONDS } = require('../config/app');

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

const sign = (unsigned) => crypto.createHmac('sha256', getSecret()).update(unsigned).digest('base64url');

// `ver` carries the user's tokenVersion; bumping it (POST /api/auth/logout-all) revokes every older token.
function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: user._id.toString(), ver: user.tokenVersion || 0, iat: now, exp: now + TOKEN_TTL_SECONDS };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const unsigned = `${parts[0]}.${parts[1]}`;
  const given = Buffer.from(parts[2]);
  const expected = Buffer.from(sign(unsigned));
  // timingSafeEqual needs equal lengths; a different length is simply a bad signature.
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    if (!authorization.startsWith('Bearer ')) throw new Error('Authentication required');
    const payload = verifyToken(authorization.slice(7));
    const user = await User.findById(payload.sub);
    if (!user) throw new Error('User account not found');
    if ((payload.ver || 0) !== (user.tokenVersion || 0)) throw new Error('Session has been signed out');
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, code: 401, errors: [error.message || 'Authentication required'] });
  }
}

// Use after requireAuth.
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, code: 403, errors: ['Admin access required'] });
  }
  next();
}

// Use after requireAuth on /:id routes: members may only read or change their own record
// (`:id` is `current` or the caller's own id), so ownership is enforced before any handler runs.
function requireSelf(req, res, next) {
  const { id } = req.params;
  if (id !== 'current' && id !== String(req.user?._id)) {
    return res.status(403).json({ success: false, code: 403, errors: ['You can only access your own profile'] });
  }
  next();
}

// The demo admin is shared by every visitor, so it can browse but not change data.
function blockDemoWrites(req, res, next) {
  if (req.user?.isDemo) {
    return res.status(403).json({
      success: false,
      code: 403,
      errors: ['This action is disabled for the shared demo admin account'],
    });
  }
  next();
}

module.exports = { createToken, requireAuth, requireAdmin, requireSelf, blockDemoWrites };

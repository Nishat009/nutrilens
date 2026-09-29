const crypto = require('crypto');
const User = require('../models/User');

const getSecret = () => process.env.JWT_SECRET || 'nutrilens-development-secret-change-me';

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
    res.status(401).json({ success: false, code: 401, errors: [error.message || 'Authentication required'] });
  }
}

module.exports = { createToken, requireAuth };

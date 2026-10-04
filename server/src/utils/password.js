const crypto = require('crypto');

// Stored format: scrypt$<salt hex>$<hash hex>
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (typeof password !== 'string' || typeof storedPassword !== 'string') return false;
  const [scheme, salt, hash] = storedPassword.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const derived = crypto.scryptSync(password, salt, expected.length);
  return expected.length > 0 && crypto.timingSafeEqual(derived, expected);
}

module.exports = { hashPassword, verifyPassword };

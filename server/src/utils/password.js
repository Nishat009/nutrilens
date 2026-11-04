const crypto = require('crypto');

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString('hex'),
});

// Stored format: scrypt$<salt>$<hash>
const encodePassword = (password) => {
  const { salt, hash } = hashPassword(password);
  return `scrypt$${salt}$${hash}`;
};

// Only scrypt hashes are accepted; a plain-text stored value never matches.
const passwordMatches = (password, storedPassword) => {
  if (typeof password !== 'string' || !storedPassword || !storedPassword.startsWith('scrypt$')) return false;
  const [, salt, hash] = storedPassword.split('$');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
};

module.exports = { encodePassword, passwordMatches };

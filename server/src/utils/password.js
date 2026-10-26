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

const passwordMatches = (password, storedPassword) => {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('scrypt$')) {
    const [, salt, hash] = storedPassword.split('$');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  }
  return password === storedPassword;
};

module.exports = { encodePassword, passwordMatches };

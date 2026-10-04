// Minimal fixed-window rate limiter keyed by client IP. In-memory, so limits are
// per server instance — enough to slow down password guessing on a single node.
function rateLimit({ windowMs, max, message = 'Too many requests, please try again later' }) {
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, code: 429, errors: [message] });
    }
    next();
  };
}

module.exports = { rateLimit };

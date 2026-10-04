// Escape user input before building a RegExp so it is matched literally
// (prevents invalid-pattern crashes and catastrophic-backtracking patterns).
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };

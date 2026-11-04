// Shared error response: { success:false, code, errors:[...] }. Accepts a message string,
// an Error, or a Mongoose ValidationError (one message per invalid field).
function sendError(res, error, fallback = 'Request failed', status = 422) {
  let errors;
  if (typeof error === 'string') errors = [error];
  else if (error?.errors && typeof error.errors === 'object') errors = Object.values(error.errors).map((item) => item.message);
  else errors = [error?.message || fallback];
  return res.status(status).json({ success: false, code: status, errors });
}

module.exports = { sendError };

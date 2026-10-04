// Maps an unexpected error to an HTTP status:
// - errors that carry a status (e.g. body-parser's 400 / 413) keep it
// - Mongoose validation / cast errors are client input problems (422)
// - anything else is a server fault (500)
function errorStatus(error) {
  if (error && Number.isInteger(error.status) && error.status >= 400 && error.status < 600) return error.status;
  if (error && (error.name === 'ValidationError' || error.name === 'CastError')) return 422;
  if (error && error.code === 11000) return 409; // MongoDB duplicate key (e.g. email already used)
  return 500;
}

// Error messages safe to show the client. 500s hide internals in production.
function errorMessages(error, fallback) {
  if (errorStatus(error) === 500 && process.env.NODE_ENV === 'production') {
    return [fallback || 'Internal Server Error'];
  }
  if (error && error.name === 'ValidationError' && error.errors) {
    return Object.values(error.errors).map((e) => e.message);
  }
  if (error && error.name === 'CastError') {
    return [`Invalid value for ${error.path}`];
  }
  if (error && error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    return [`An account with this ${field} already exists`];
  }
  return [(error && error.message) || fallback || 'Internal Server Error'];
}

function sendError(res, status, errors) {
  return res.status(status).json({
    success: false,
    code: status,
    errors: Array.isArray(errors) ? errors : [errors],
  });
}

function sendUnexpectedError(res, error, fallback) {
  const status = errorStatus(error);
  if (status === 500) console.error(error);
  return sendError(res, status, errorMessages(error, fallback));
}

module.exports = { errorStatus, errorMessages, sendError, sendUnexpectedError };

/**
 * Wraps an async Express route/middleware handler so a rejected promise is
 * forwarded to next(err) instead of crashing the process (Express 4 does not
 * do this automatically for async handlers).
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;

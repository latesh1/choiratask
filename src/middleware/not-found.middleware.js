const AppError = require('../utils/app-error');

/**
 * Catch-all middleware for non-existent API routes.
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404));
};

module.exports = notFoundHandler;

const config = require('../config/env');
const AppError = require('../utils/app-error');
const { sendError } = require('../utils/responses');

/**
 * Centralized error-handling middleware.
 * Formats all operational and unexpected errors into a consistent JSON response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || 500;
  error.errors = err.errors || [];

  // Handle express-validator / custom AppError directly
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.errors);
  }

  // Handle malformed JSON in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'Malformed JSON in request payload', []);
  }

  // Handle MySQL Duplicate Entry (ER_DUP_ENTRY / 1062)
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    const message = 'A record with this unique identifier already exists';
    return sendError(res, 409, message, []);
  }

  // Handle MySQL Connection / Access errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    const message = config.nodeEnv === 'production'
      ? 'Database service is currently unavailable'
      : `MySQL Error: ${err.message}`;
    return sendError(res, 500, message, []);
  }

  // Handle Mongoose CastError (e.g. invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid format for field "${err.path}": ${err.value}`;
    return sendError(res, 400, message, []);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message
    }));
    return sendError(res, 422, 'Validation failed', formattedErrors);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid authentication token', []);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Authentication token has expired. Please log in again', []);
  }

  // Unexpected Server Errors (500)
  const statusCode = error.statusCode || 500;
  const message = config.nodeEnv === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  if (statusCode === 500) {
    console.error('[UNHANDLED ERROR]', err);
  }

  return sendError(res, statusCode, message, error.errors);
};

module.exports = errorHandler;

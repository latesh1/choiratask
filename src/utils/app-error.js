/**
 * Custom application error class for operational errors with HTTP status codes.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 409, 422)
   * @param {Array} [errors=[]] - Array of validation or detailed error objects
   */
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

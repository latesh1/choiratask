/**
 * Standardized API response helpers to ensure uniform response structures across all endpoints.
 */

/**
 * Send a standardized success JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {string} message - Human-readable success message
 * @param {any} [data=null] - Payload object or array
 * @param {object} [pagination=null] - Optional pagination metadata
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  const responseBody = {
    success: true,
    message,
    data
  };

  if (pagination) {
    responseBody.pagination = pagination;
  }

  return res.status(statusCode).json(responseBody);
};

/**
 * Send a standardized error JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 422, 500)
 * @param {string} message - Human-readable error message
 * @param {Array} [errors=[]] - Array of error details/validation errors
 */
const sendError = (res, statusCode = 500, message = 'An error occurred', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  sendSuccess,
  sendError
};

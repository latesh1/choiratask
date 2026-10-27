const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/app-error');
const asyncHandler = require('../utils/async-handler');
const mysql = require('../config/mysql');

/**
 * Authentication middleware that verifies JWT and attaches authenticated user info to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }

  if (!decoded || !decoded.userId) {
    return next(new AppError('Invalid authentication token payload.', 401));
  }

  // Check if user still exists in database
  const [rows] = await mysql.query(
    'SELECT id, name, email FROM users WHERE id = ? LIMIT 1',
    [decoded.userId]
  );

  if (!rows || rows.length === 0) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Attach authenticated user to request
  req.user = {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email
  };

  next();
});

module.exports = {
  authenticate
};

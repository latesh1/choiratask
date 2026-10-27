const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('../config/mysql');
const config = require('../config/env');
const AppError = require('../utils/app-error');

/**
 * Generate a signed JWT for a user.
 * @param {object} payload
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Register a new user in MySQL.
 */
const register = async ({ name, email, password }) => {
  // Check if email already exists
  const [existing] = await mysql.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  if (existing.length > 0) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  // Insert user
  const [result] = await mysql.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );

  const userId = result.insertId;
  const token = generateToken({ userId, email });

  return {
    user: {
      id: userId,
      name,
      email
    },
    token
  };
};

/**
 * Authenticate user with email and password.
 */
const login = async ({ email, password }) => {
  const [rows] = await mysql.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  // Generic message to prevent user enumeration
  if (rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({ userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    },
    token
  };
};

/**
 * Retrieve user profile by user ID.
 */
const getProfile = async (userId) => {
  const [rows] = await mysql.query(
    'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  if (rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  return rows[0];
};

/**
 * Update authenticated user's profile with permitted fields only.
 */
const updateProfile = async (userId, { name, email }) => {
  // Whitelist update fields
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email.trim();

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid profile fields provided for update', 400);
  }

  // If email is changing, verify it is not already taken by another account
  if (updates.email) {
    const [existing] = await mysql.query(
      'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
      [updates.email, userId]
    );

    if (existing.length > 0) {
      throw new AppError('Email is already in use by another account', 409);
    }
  }

  // Construct parameterized UPDATE query safely
  const setClauses = [];
  const params = [];

  for (const [key, val] of Object.entries(updates)) {
    setClauses.push(`\`${key}\` = ?`);
    params.push(val);
  }

  params.push(userId);
  await mysql.query(
    `UPDATE users SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );

  return getProfile(userId);
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  generateToken
};

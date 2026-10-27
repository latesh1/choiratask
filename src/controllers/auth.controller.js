const authService = require('../services/auth.service');
const asyncHandler = require('../utils/async-handler');
const { sendSuccess } = require('../utils/responses');

/**
 * Handle user registration.
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.register({ name, email, password });
  return sendSuccess(res, 201, 'User registered successfully', result);
});

/**
 * Handle user login.
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  return sendSuccess(res, 200, 'Login successful', result);
});

/**
 * Handle fetching current user's profile.
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return sendSuccess(res, 200, 'Profile retrieved successfully', { user });
});

/**
 * Handle updating current user's profile.
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  // Explicitly extract only permitted fields
  const { name, email } = req.body;
  const user = await authService.updateProfile(req.user.id, { name, email });
  return sendSuccess(res, 200, 'Profile updated successfully', { user });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};

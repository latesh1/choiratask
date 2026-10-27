const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/async-handler');
const { sendSuccess } = require('../utils/responses');

/**
 * Handle retrieving dashboard metrics for the authenticated user.
 * GET /api/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.user.id);
  return sendSuccess(res, 200, 'Dashboard statistics retrieved successfully', stats);
});

module.exports = {
  getDashboard
};

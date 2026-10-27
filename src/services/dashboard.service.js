const mysql = require('../config/mysql');
const Task = require('../models/task.model');

/**
 * Retrieve aggregated dashboard statistics for authenticated user.
 *
 * NOTE ON DISTRIBUTED TRANSACTIONS:
 * The project statistics are fetched from MySQL and the task statistics are fetched
 * from MongoDB. These are two independent database reads executed asynchronously without
 * a distributed transaction or 2-phase commit. They provide near-real-time operational
 * metrics suitable for dashboard reporting.
 *
 * @param {number} userId - The authenticated user's MySQL ID
 * @returns {Promise<object>} Dashboard metrics
 */
const getDashboardStats = async (userId) => {
  const numericUserId = parseInt(userId, 10);

  // 1. MySQL Aggregation: Project counts
  const [projectRows] = await mysql.query(
    `SELECT
       COUNT(*) AS totalProjects,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeProjects,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedProjects
     FROM projects
     WHERE user_id = ?`,
    [numericUserId]
  );

  const projectCounts = projectRows[0] || {};
  const totalProjects = parseInt(projectCounts.totalProjects || 0, 10);
  const activeProjects = parseInt(projectCounts.activeProjects || 0, 10);
  const completedProjects = parseInt(projectCounts.completedProjects || 0, 10);

  // 2. MongoDB Aggregation: Task counts
  const taskAggResult = await Task.aggregate([
    { $match: { userId: numericUserId } },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        pendingTasks: {
          $sum: {
            $cond: [{ $in: ['$status', ['todo', 'in_progress']] }, 1, 0]
          }
        },
        completedTasks: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        highPriorityTasks: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'high'] }, 1, 0]
          }
        }
      }
    }
  ]);

  const taskCounts = taskAggResult.length > 0 ? taskAggResult[0] : {};
  const totalTasks = taskCounts.totalTasks || 0;
  const pendingTasks = taskCounts.pendingTasks || 0;
  const completedTasks = taskCounts.completedTasks || 0;
  const highPriorityTasks = taskCounts.highPriorityTasks || 0;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    pendingTasks,
    completedTasks,
    highPriorityTasks
  };
};

module.exports = {
  getDashboardStats
};

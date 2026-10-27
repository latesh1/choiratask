const mysql = require('../config/mysql');
const Task = require('../models/task.model');
const AppError = require('../utils/app-error');

/**
 * Create a new project for the authenticated user.
 */
const createProject = async (userId, { name, description = null, status = 'active' }) => {
  const [result] = await mysql.query(
    'INSERT INTO projects (user_id, name, description, status) VALUES (?, ?, ?, ?)',
    [userId, name.trim(), description ? description.trim() : null, status]
  );

  return getProjectById(userId, result.insertId);
};

/**
 * Get all projects belonging to the authenticated user.
 */
const getUserProjects = async (userId) => {
  const [rows] = await mysql.query(
    'SELECT id, user_id, name, description, status, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

/**
 * Get a specific project by ID belonging to the authenticated user.
 * Returns 404 if project does not exist or belongs to another user.
 */
const getProjectById = async (userId, projectId) => {
  const [rows] = await mysql.query(
    'SELECT id, user_id, name, description, status, created_at, updated_at FROM projects WHERE id = ? AND user_id = ? LIMIT 1',
    [projectId, userId]
  );

  if (rows.length === 0) {
    throw new AppError('Project not found', 404);
  }

  return rows[0];
};

/**
 * Update an existing project owned by the authenticated user.
 */
const updateProject = async (userId, projectId, { name, description, status }) => {
  // Confirm ownership and existence
  await getProjectById(userId, projectId);

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description !== null ? description.trim() : null;
  if (status !== undefined) updates.status = status.trim();

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided for project update', 400);
  }

  const setClauses = [];
  const params = [];

  for (const [key, val] of Object.entries(updates)) {
    setClauses.push(`\`${key}\` = ?`);
    params.push(val);
  }

  params.push(projectId, userId);

  await mysql.query(
    `UPDATE projects SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    params
  );

  return getProjectById(userId, projectId);
};

/**
 * Safely delete a project owned by the authenticated user.
 * Policy: Cascading task cleanup. Explicitly removes all associated tasks in MongoDB
 * to prevent orphaned tasks, then deletes the project record in MySQL.
 */
const deleteProject = async (userId, projectId) => {
  // Confirm ownership and existence
  await getProjectById(userId, projectId);

  // 1. Clean up associated tasks in MongoDB for this project and owner
  let deletedTasksCount = 0;
  try {
    const taskDeleteResult = await Task.deleteMany({ projectId, userId });
    deletedTasksCount = taskDeleteResult.deletedCount || 0;
  } catch (err) {
    console.warn(`[Project Delete] Task cleanup notice: ${err.message}`);
  }

  // 2. Delete project from MySQL
  await mysql.query(
    'DELETE FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId]
  );

  return {
    id: projectId,
    deletedTasksCount
  };
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject
};

const mongoose = require('mongoose');
const Task = require('../models/task.model');
const mysql = require('../config/mysql');
const AppError = require('../utils/app-error');

/**
 * Verify that a project exists in MySQL and is owned by the user.
 * @param {number} userId
 * @param {number} projectId
 */
const verifyProjectOwnership = async (userId, projectId) => {
  const [rows] = await mysql.query(
    'SELECT id FROM projects WHERE id = ? AND user_id = ? LIMIT 1',
    [projectId, userId]
  );

  if (rows.length === 0) {
    throw new AppError(
      'Referenced project does not exist or does not belong to the authenticated user',
      404
    );
  }
  return true;
};

/**
 * Create a new task.
 */
const createTask = async (userId, taskData) => {
  const numericUserId = parseInt(userId, 10);
  const numericProjectId = parseInt(taskData.projectId, 10);

  // Verify project existence and ownership in MySQL
  await verifyProjectOwnership(numericUserId, numericProjectId);

  // Whitelist writable fields to prevent mass assignment
  const newTask = new Task({
    title: taskData.title.trim(),
    description: taskData.description ? taskData.description.trim() : '',
    projectId: numericProjectId,
    userId: numericUserId,
    status: taskData.status || 'todo',
    priority: taskData.priority || 'medium',
    dueDate: taskData.dueDate || null
  });

  const savedTask = await newTask.save();
  return savedTask;
};

/**
 * Retrieve paginated tasks for authenticated user with optional filtering.
 */
const getTasks = async (userId, query = {}) => {
  const numericUserId = parseInt(userId, 10);
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 10, 100);

  // Build filter scoped strictly to the authenticated user
  const filter = { userId: numericUserId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.projectId !== undefined) {
    filter.projectId = parseInt(query.projectId, 10);
  }

  // Calculate total matching records before pagination
  const totalRecords = await Task.countDocuments(filter);
  const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / limit) : 0;
  const skip = (page - 1) * limit;

  // Retrieve paginated tasks
  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    tasks,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages
    }
  };
};

/**
 * Retrieve a single task by ID for authenticated user.
 */
const getTaskById = async (userId, taskId) => {
  if (!mongoose.isValidObjectId(taskId)) {
    throw new AppError('Invalid task ID format. Must be a valid 24-character hexadecimal ObjectId', 400);
  }

  const numericUserId = parseInt(userId, 10);
  const task = await Task.findOne({ _id: taskId, userId: numericUserId });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return task;
};

/**
 * Update a task owned by the authenticated user.
 */
const updateTask = async (userId, taskId, updateData) => {
  if (!mongoose.isValidObjectId(taskId)) {
    throw new AppError('Invalid task ID format. Must be a valid 24-character hexadecimal ObjectId', 400);
  }

  const numericUserId = parseInt(userId, 10);
  const task = await Task.findOne({ _id: taskId, userId: numericUserId });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // If reassigning to a different project, verify ownership of the new project
  if (updateData.projectId !== undefined && updateData.projectId !== task.projectId) {
    const newProjectId = parseInt(updateData.projectId, 10);
    await verifyProjectOwnership(numericUserId, newProjectId);
    task.projectId = newProjectId;
  }

  // Whitelist update fields to prevent mass assignment
  if (updateData.title !== undefined) {
    task.title = updateData.title.trim();
  }
  if (updateData.description !== undefined) {
    task.description = updateData.description !== null ? updateData.description.trim() : '';
  }
  if (updateData.status !== undefined) {
    task.status = updateData.status;
  }
  if (updateData.priority !== undefined) {
    task.priority = updateData.priority;
  }
  if (updateData.dueDate !== undefined) {
    task.dueDate = updateData.dueDate;
  }

  const updatedTask = await task.save();
  return updatedTask;
};

/**
 * Delete a task owned by the authenticated user.
 */
const deleteTask = async (userId, taskId) => {
  if (!mongoose.isValidObjectId(taskId)) {
    throw new AppError('Invalid task ID format. Must be a valid 24-character hexadecimal ObjectId', 400);
  }

  const numericUserId = parseInt(userId, 10);
  const task = await Task.findOneAndDelete({ _id: taskId, userId: numericUserId });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return { id: taskId };
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  verifyProjectOwnership
};

const taskService = require('../services/task.service');
const asyncHandler = require('../utils/async-handler');
const { sendSuccess } = require('../utils/responses');

/**
 * Handle task creation.
 * POST /api/tasks
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, status, priority, dueDate } = req.body;
  const task = await taskService.createTask(req.user.id, {
    title,
    description,
    projectId,
    status,
    priority,
    dueDate
  });
  return sendSuccess(res, 201, 'Task created successfully', { task });
});

/**
 * Handle paginated and filtered tasks retrieval.
 * GET /api/tasks
 */
const getTasks = asyncHandler(async (req, res) => {
  const { tasks, pagination } = await taskService.getTasks(req.user.id, req.query);
  return sendSuccess(res, 200, 'Tasks retrieved successfully', tasks, pagination);
});

/**
 * Handle fetching single task by ID.
 * GET /api/tasks/:id
 */
const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.user.id, req.params.id);
  return sendSuccess(res, 200, 'Task retrieved successfully', { task });
});

/**
 * Handle updating a task.
 * PUT /api/tasks/:id
 */
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, status, priority, dueDate } = req.body;
  const task = await taskService.updateTask(req.user.id, req.params.id, {
    title,
    description,
    projectId,
    status,
    priority,
    dueDate
  });
  return sendSuccess(res, 200, 'Task updated successfully', { task });
});

/**
 * Handle deleting a task.
 * DELETE /api/tasks/:id
 */
const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.user.id, req.params.id);
  return sendSuccess(res, 200, 'Task deleted successfully', result);
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};

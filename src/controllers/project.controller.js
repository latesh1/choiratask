const projectService = require('../services/project.service');
const asyncHandler = require('../utils/async-handler');
const { sendSuccess } = require('../utils/responses');

/**
 * Handle project creation.
 * POST /api/projects
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;
  const project = await projectService.createProject(req.user.id, {
    name,
    description,
    status
  });
  return sendSuccess(res, 201, 'Project created successfully', { project });
});

/**
 * Handle listing all projects for authenticated user.
 * GET /api/projects
 */
const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getUserProjects(req.user.id);
  return sendSuccess(res, 200, 'Projects retrieved successfully', { projects });
});

/**
 * Handle fetching single project by ID.
 * GET /api/projects/:id
 */
const getProjectById = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const project = await projectService.getProjectById(req.user.id, projectId);
  return sendSuccess(res, 200, 'Project retrieved successfully', { project });
});

/**
 * Handle updating an existing project.
 * PUT /api/projects/:id
 */
const updateProject = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const { name, description, status } = req.body;
  const project = await projectService.updateProject(req.user.id, projectId, {
    name,
    description,
    status
  });
  return sendSuccess(res, 200, 'Project updated successfully', { project });
});

/**
 * Handle deleting a project.
 * DELETE /api/projects/:id
 */
const deleteProject = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const result = await projectService.deleteProject(req.user.id, projectId);
  return sendSuccess(res, 200, 'Project deleted successfully', result);
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};

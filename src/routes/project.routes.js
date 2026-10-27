const express = require('express');
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator
} = require('../validators/project.validator');

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

router.post('/', validate(createProjectValidator), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', validate(projectIdValidator), projectController.getProjectById);
router.put('/:id', validate(updateProjectValidator), projectController.updateProject);
router.delete('/:id', validate(projectIdValidator), projectController.deleteProject);

module.exports = router;

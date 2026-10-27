const express = require('express');
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  taskQueryValidator
} = require('../validators/task.validator');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

router.post('/', validate(createTaskValidator), taskController.createTask);
router.get('/', validate(taskQueryValidator), taskController.getTasks);
router.get('/:id', validate(taskIdValidator), taskController.getTaskById);
router.put('/:id', validate(updateTaskValidator), taskController.updateTask);
router.delete('/:id', validate(taskIdValidator), taskController.deleteTask);

module.exports = router;

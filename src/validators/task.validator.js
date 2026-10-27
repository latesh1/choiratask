const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

const allowedQueryParams = ['page', 'limit', 'status', 'priority', 'projectId'];

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be between 1 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer')
    .toInt(),
  body('status')
    .optional()
    .trim()
    .isIn(['todo', 'in_progress', 'completed'])
    .withMessage('Status must be one of: todo, in_progress, completed'),
  body('priority')
    .optional()
    .trim()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date string')
    .toDate()
];

const updateTaskValidator = [
  param('id').custom((value) => {
    if (!mongoose.isValidObjectId(value)) {
      throw new Error('Invalid task ID format. Must be a valid 24-character hexadecimal ObjectId');
    }
    return true;
  }),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be between 1 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('projectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer')
    .toInt(),
  body('status')
    .optional()
    .trim()
    .isIn(['todo', 'in_progress', 'completed'])
    .withMessage('Status must be one of: todo, in_progress, completed'),
  body('priority')
    .optional()
    .trim()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date string')
    .toDate(),
  body().custom((value, { req }) => {
    if (
      req.body.title === undefined &&
      req.body.description === undefined &&
      req.body.projectId === undefined &&
      req.body.status === undefined &&
      req.body.priority === undefined &&
      req.body.dueDate === undefined
    ) {
      throw new Error('At least one field must be provided for task update');
    }
    return true;
  })
];

const taskIdValidator = [
  param('id').custom((value) => {
    if (!mongoose.isValidObjectId(value)) {
      throw new Error('Invalid task ID format. Must be a valid 24-character hexadecimal ObjectId');
    }
    return true;
  })
];

const taskQueryValidator = [
  query().custom((value, { req }) => {
    const unknownParams = Object.keys(req.query).filter(
      (paramName) => !allowedQueryParams.includes(paramName)
    );
    if (unknownParams.length > 0) {
      throw new Error(`Unsupported query parameter(s): ${unknownParams.join(', ')}`);
    }
    return true;
  }),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer greater than or equal to 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
  query('status')
    .optional()
    .isIn(['todo', 'in_progress', 'completed'])
    .withMessage('Status filter must be one of: todo, in_progress, completed'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority filter must be one of: low, medium, high'),
  query('projectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ProjectId filter must be a positive integer')
    .toInt()
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  taskQueryValidator
};

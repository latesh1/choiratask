const { body, param } = require('express-validator');

const createProjectValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('status')
    .optional()
    .trim()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be one of: active, completed, archived')
];

const updateProjectValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer')
    .toInt(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('status')
    .optional()
    .trim()
    .isIn(['active', 'completed', 'archived'])
    .withMessage('Status must be one of: active, completed, archived'),
  body().custom((value, { req }) => {
    if (
      req.body.name === undefined &&
      req.body.description === undefined &&
      req.body.status === undefined
    ) {
      throw new Error('At least one field (name, description, or status) must be provided for update');
    }
    return true;
  })
];

const projectIdValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer')
    .toInt()
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator
};

const { validationResult } = require('express-validator');
const AppError = require('../utils/app-error');

/**
 * Middleware to check express-validator validation results.
 * If validation fails, extracts formatted errors and passes an AppError to next().
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return next(new AppError('Validation failed', 422, formattedErrors));
  };
};

module.exports = validate;

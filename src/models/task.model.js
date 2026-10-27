const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    projectId: {
      type: Number,
      required: [true, 'Project ID is required'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer project ID'
      }
    },
    userId: {
      type: Number,
      required: [true, 'User ID is required'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid integer user ID'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in_progress', 'completed'],
        message: 'Status must be one of: todo, in_progress, completed'
      },
      default: 'todo'
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be one of: low, medium, high'
      },
      default: 'medium'
    },
    dueDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for optimized scoping and filtering
TaskSchema.index({ userId: 1, projectId: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;

/**
 * Interactive In-Memory Dev Server for Postman & Manual Testing.
 * Allows instant testing of all endpoints (Auth, Projects, Tasks, Dashboard)
 * without requiring local MySQL or MongoDB daemons to be installed.
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('./config/env');
const mysql = require('./config/mysql');
const Task = require('./models/task.model');
const app = require('./app');

// In-Memory Data Stores
let users = [];
let projects = [];
let tasks = [];
let nextUserId = 1;
let nextProjectId = 1;

// Override mysql.query with an in-memory SQL handler
mysql.query = async (sql, params = []) => {
  const normalizedSql = sql.trim();

  // 1. Auth: Check duplicate email
  if (normalizedSql.startsWith('SELECT id FROM users WHERE email = ?')) {
    const email = params[0];
    const found = users.filter((u) => u.email.toLowerCase() === email.toLowerCase());
    return [found.map((u) => ({ id: u.id }))];
  }

  // 2. Auth: Insert User
  if (normalizedSql.startsWith('INSERT INTO users')) {
    const [name, email, passwordHash] = params;
    const newUser = {
      id: nextUserId++,
      name,
      email,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    users.push(newUser);
    return [{ insertId: newUser.id, affectedRows: 1 }];
  }

  // 3. Auth: Login lookup
  if (normalizedSql.startsWith('SELECT id, name, email, password_hash FROM users WHERE email = ?')) {
    const email = params[0];
    const found = users.filter((u) => u.email.toLowerCase() === email.toLowerCase());
    return [found];
  }

  // 4. Auth: User lookup by ID (middleware & profile)
  if (normalizedSql.includes('FROM users WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    const found = users.filter((u) => u.id === id);
    return [found];
  }

  // 5. Auth: Update profile email collision check
  if (normalizedSql.includes('SELECT id FROM users WHERE email = ? AND id != ?')) {
    const [email, id] = params;
    const found = users.filter((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== parseInt(id, 10));
    return [found.map((u) => ({ id: u.id }))];
  }

  // 6. Auth: Update profile
  if (normalizedSql.startsWith('UPDATE users SET')) {
    const id = parseInt(params[params.length - 1], 10);
    const user = users.find((u) => u.id === id);
    if (user) {
      if (params.length === 3) {
        user.name = params[0];
        user.email = params[1];
      } else if (params.length === 2) {
        if (normalizedSql.includes('`name` = ?')) user.name = params[0];
        if (normalizedSql.includes('`email` = ?')) user.email = params[0];
      }
      user.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: 1 }];
  }

  // 7. Projects: Insert
  if (normalizedSql.startsWith('INSERT INTO projects')) {
    const [userId, name, description, status] = params;
    const newProject = {
      id: nextProjectId++,
      user_id: parseInt(userId, 10),
      name,
      description,
      status: status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    projects.push(newProject);
    return [{ insertId: newProject.id, affectedRows: 1 }];
  }

  // 8. Projects: List by user
  if (normalizedSql.includes('FROM projects WHERE user_id = ?')) {
    const userId = parseInt(params[0], 10);
    const userProjects = projects
      .filter((p) => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return [userProjects];
  }

  // 9. Projects: Get by ID & User (or verifyProjectOwnership)
  if (normalizedSql.includes('FROM projects WHERE id = ? AND user_id = ?')) {
    const [projectId, userId] = params.map((v) => parseInt(v, 10));
    const found = projects.filter((p) => p.id === projectId && p.user_id === userId);
    return [found];
  }

  // 10. Projects: Update
  if (normalizedSql.startsWith('UPDATE projects SET')) {
    const userId = parseInt(params[params.length - 1], 10);
    const projectId = parseInt(params[params.length - 2], 10);
    const project = projects.find((p) => p.id === projectId && p.user_id === userId);
    if (project) {
      for (let i = 0; i < params.length - 2; i++) {
        if (normalizedSql.includes('`name` = ?') && i === 0) project.name = params[i];
        if (normalizedSql.includes('`description` = ?')) project.description = params[i];
        if (normalizedSql.includes('`status` = ?')) project.status = params[i];
      }
      project.updated_at = new Date().toISOString();
    }
    return [{ affectedRows: 1 }];
  }

  // 11. Projects: Delete
  if (normalizedSql.startsWith('DELETE FROM projects WHERE id = ? AND user_id = ?')) {
    const [projectId, userId] = params.map((v) => parseInt(v, 10));
    const initialLen = projects.length;
    projects = projects.filter((p) => !(p.id === projectId && p.user_id === userId));
    return [{ affectedRows: initialLen - projects.length }];
  }

  // 12. Dashboard: Projects aggregation
  if (normalizedSql.includes('COUNT(*) AS totalProjects')) {
    const userId = parseInt(params[0], 10);
    const userProjects = projects.filter((p) => p.user_id === userId);
    const totalProjects = userProjects.length;
    const activeProjects = userProjects.filter((p) => p.status === 'active').length;
    const completedProjects = userProjects.filter((p) => p.status === 'completed').length;
    return [[{ totalProjects, activeProjects, completedProjects }]];
  }

  return [[]];
};

// Override Task prototype save for newly instantiated Task documents
Task.prototype.save = async function () {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }
  const taskObj = {
    _id: this._id,
    title: this.title,
    description: this.description || '',
    projectId: this.projectId,
    userId: this.userId,
    status: this.status || 'todo',
    priority: this.priority || 'medium',
    dueDate: this.dueDate || null,
    createdAt: this.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function () { return { ...this }; }
  };

  const existingIdx = tasks.findIndex((t) => t._id.toString() === this._id.toString());
  if (existingIdx >= 0) {
    tasks[existingIdx] = taskObj;
  } else {
    tasks.push(taskObj);
  }
  return taskObj;
};

// Override Mongoose Task model methods with in-memory store
Task.find = (filter = {}) => {
  let filtered = tasks.filter((t) => {
    if (filter.userId !== undefined && t.userId !== filter.userId) return false;
    if (filter.status !== undefined && t.status !== filter.status) return false;
    if (filter.priority !== undefined && t.priority !== filter.priority) return false;
    if (filter.projectId !== undefined && t.projectId !== filter.projectId) return false;
    return true;
  });

  return {
    sort: () => ({
      skip: (skipCount) => ({
        limit: async (limitCount) => {
          return filtered.slice(skipCount, skipCount + limitCount);
        }
      })
    })
  };
};

Task.countDocuments = async (filter = {}) => {
  return tasks.filter((t) => {
    if (filter.userId !== undefined && t.userId !== filter.userId) return false;
    if (filter.status !== undefined && t.status !== filter.status) return false;
    if (filter.priority !== undefined && t.priority !== filter.priority) return false;
    if (filter.projectId !== undefined && t.projectId !== filter.projectId) return false;
    return true;
  }).length;
};

Task.findOne = async (filter = {}) => {
  const task = tasks.find((t) => {
    if (filter._id && t._id.toString() !== filter._id.toString()) return false;
    if (filter.userId !== undefined && t.userId !== filter.userId) return false;
    return true;
  });

  if (!task) return null;

  return {
    ...task,
    save: async function () {
      Object.assign(task, this);
      task.updatedAt = new Date().toISOString();
      return task;
    }
  };
};

Task.findOneAndDelete = async (filter = {}) => {
  const index = tasks.findIndex((t) => {
    if (filter._id && t._id.toString() !== filter._id.toString()) return false;
    if (filter.userId !== undefined && t.userId !== filter.userId) return false;
    return true;
  });

  if (index === -1) return null;
  const deleted = tasks.splice(index, 1)[0];
  return deleted;
};

Task.deleteMany = async (filter = {}) => {
  const initialLen = tasks.length;
  tasks = tasks.filter((t) => {
    if (filter.projectId !== undefined && t.projectId === filter.projectId) return false;
    if (filter.userId !== undefined && t.userId === filter.userId) return false;
    return true;
  });
  return { deletedCount: initialLen - tasks.length };
};

Task.aggregate = async (pipeline = []) => {
  const match = pipeline[0]?.$match || {};
  const userTasks = tasks.filter((t) => t.userId === match.userId);

  if (userTasks.length === 0) return [];

  const totalTasks = userTasks.length;
  const pendingTasks = userTasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length;
  const completedTasks = userTasks.filter((t) => t.status === 'completed').length;
  const highPriorityTasks = userTasks.filter((t) => t.priority === 'high').length;

  return [{
    totalTasks,
    pendingTasks,
    completedTasks,
    highPriorityTasks
  }];
};

// Seed an initial user for testing convenience
(async () => {
  const hashed = await bcrypt.hash('MusicProd#2026', 10);
  users.push({
    id: nextUserId++,
    name: 'Latesh Billava',
    email: 'latesh.billava11@gmail.com',
    password_hash: hashed,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  projects.push({
    id: nextProjectId++,
    user_id: 1,
    name: 'Sample Audio Master Project',
    description: 'Initial project for Postman verification',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const sampleTaskId = new mongoose.Types.ObjectId('671e0f31c26f63412cbdf321');
  tasks.push({
    _id: sampleTaskId,
    title: 'Implement Low-Pass Biquad Filter',
    description: 'DSP audio filter algorithm',
    projectId: 1,
    userId: 1,
    status: 'todo',
    priority: 'high',
    dueDate: '2026-12-31T23:59:59.000Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function () { return { ...this }; }
  });
})();

const PORT = config.port || 5000;
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`[Choira Mock Dev Server] Running on http://localhost:${PORT}`);
  console.log('Mode: In-Memory (No MySQL or MongoDB installation needed)');
  console.log('Pre-seeded User: latesh.billava11@gmail.com (Password: MusicProd#2026)');
  console.log('Ready for Postman requests!');
  console.log('====================================================');
});

module.exports = server;

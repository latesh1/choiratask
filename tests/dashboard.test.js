const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/mysql');
jest.mock('../src/models/task.model');

const mysql = require('../src/config/mysql');
const Task = require('../src/models/task.model');
const config = require('../src/config/env');
const app = require('../src/app');

describe('Dashboard API (GET /api/dashboard)', () => {
  const userId = 42;
  const userToken = jwt.sign({ userId, email: 'user42@example.com' }, config.jwt.secret);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return aggregated dashboard statistics for authenticated user', async () => {
    // 1. Auth middleware verification
    mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Producer', email: 'user42@example.com' }]]);

    // 2. MySQL aggregate query mock
    mysql.query.mockResolvedValueOnce([[
      {
        totalProjects: '5',
        activeProjects: '3',
        completedProjects: '2'
      }
    ]]);

    // 3. MongoDB aggregate query mock
    Task.aggregate.mockResolvedValueOnce([
      {
        totalTasks: 12,
        pendingTasks: 8,
        completedTasks: 4,
        highPriorityTasks: 3
      }
    ]);

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Dashboard statistics retrieved successfully');
    expect(res.body.data).toEqual({
      totalProjects: 5,
      activeProjects: 3,
      completedProjects: 2,
      totalTasks: 12,
      pendingTasks: 8,
      completedTasks: 4,
      highPriorityTasks: 3
    });

    // Check MySQL aggregate call was scoped to userId
    const mysqlCall = mysql.query.mock.calls[1];
    expect(mysqlCall[1]).toEqual([userId]);

    // Check MongoDB aggregate call was scoped to userId
    const mongoCall = Task.aggregate.mock.calls[0][0];
    expect(mongoCall[0].$match).toEqual({ userId });
  });

  it('should return default zero counts when user has no projects or tasks', async () => {
    mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'New User', email: 'user42@example.com' }]]);
    mysql.query.mockResolvedValueOnce([[
      {
        totalProjects: '0',
        activeProjects: null,
        completedProjects: null
      }
    ]]);

    Task.aggregate.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      highPriorityTasks: 0
    });
  });

  it('should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });
});

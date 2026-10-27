const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/mysql');
jest.mock('../src/models/task.model');

const mysql = require('../src/config/mysql');
const Task = require('../src/models/task.model');
const config = require('../src/config/env');
const app = require('../src/app');

describe('Project Management API (/api/projects)', () => {
  const userId = 10;
  const userToken = jwt.sign({ userId, email: 'user10@example.com' }, config.jwt.secret);

  const otherUserId = 20;
  const otherUserToken = jwt.sign({ userId: otherUserId, email: 'user20@example.com' }, config.jwt.secret);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully for the authenticated user', async () => {
      // 1. Auth middleware user verification
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);
      // 2. Project insert
      mysql.query.mockResolvedValueOnce([{ insertId: 5 }]);
      // 3. Project getById
      mysql.query.mockResolvedValueOnce([[
        {
          id: 5,
          user_id: userId,
          name: 'New Audio Plugin',
          description: 'VST plugin development',
          status: 'active',
          created_at: '2026-01-01',
          updated_at: '2026-01-01'
        }
      ]]);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Audio Plugin',
          description: 'VST plugin development',
          status: 'active'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.id).toBe(5);
      expect(res.body.data.project.user_id).toBe(userId);
      expect(res.body.data.project.name).toBe('New Audio Plugin');

      // Verify parameterized query was called with user_id
      const insertCall = mysql.query.mock.calls[1];
      expect(insertCall[1][0]).toBe(userId);
      expect(insertCall[1][1]).toBe('New Audio Plugin');
    });

    it('should reject invalid project status with 422', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Invalid Project',
          status: 'invalid_status_value'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/projects', () => {
    it('should return only projects owned by the authenticated user', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);
      mysql.query.mockResolvedValueOnce([[
        { id: 1, user_id: userId, name: 'Project 1', status: 'active' },
        { id: 2, user_id: userId, name: 'Project 2', status: 'completed' }
      ]]);

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projects.length).toBe(2);
      expect(res.body.data.projects[0].user_id).toBe(userId);

      // Verify query is strictly filtered by user_id
      const selectCall = mysql.query.mock.calls[1];
      expect(selectCall[1]).toEqual([userId]);
    });
  });

  describe('GET /api/projects/:id (Ownership Enforcement)', () => {
    it('should return project if owned by user', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);
      mysql.query.mockResolvedValueOnce([[
        { id: 1, user_id: userId, name: 'Project 1', status: 'active' }
      ]]);

      const res = await request(app)
        .get('/api/projects/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.project.id).toBe(1);
    });

    it('should return 404 and NOT disclose project if owned by another user', async () => {
      // User 20 tries to access User 10's project #1
      mysql.query.mockResolvedValueOnce([[{ id: otherUserId, name: 'Other', email: 'user20@example.com' }]]);
      // Query filters WHERE id = 1 AND user_id = 20 -> yields 0 rows
      mysql.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .get('/api/projects/1')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Project not found');
    });

    it('should return 422 for invalid non-integer project ID', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);

      const res = await request(app)
        .get('/api/projects/not-a-number')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project if owned by user', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]); // Auth
      mysql.query.mockResolvedValueOnce([[{ id: 1, user_id: userId, name: 'Old Name' }]]); // Ownership check
      mysql.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE
      mysql.query.mockResolvedValueOnce([[
        { id: 1, user_id: userId, name: 'Updated Name', status: 'completed' }
      ]]); // getById

      const res = await request(app)
        .put('/api/projects/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Name',
          status: 'completed'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.project.name).toBe('Updated Name');
    });

    it('should return 404 when updating non-existent or other user project', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: otherUserId, name: 'Other', email: 'user20@example.com' }]]);
      mysql.query.mockResolvedValueOnce([[]]); // Not found for this user

      const res = await request(app)
        .put('/api/projects/1')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Project not found');
    });
  });

  describe('DELETE /api/projects/:id (Safe Cascading Task Cleanup)', () => {
    it('should delete project and clean up associated MongoDB tasks', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]); // Auth
      mysql.query.mockResolvedValueOnce([[{ id: 1, user_id: userId, name: 'To Delete' }]]); // Ownership check
      Task.deleteMany.mockResolvedValueOnce({ deletedCount: 3 }); // MongoDB task cleanup
      mysql.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // MySQL project delete

      const res = await request(app)
        .delete('/api/projects/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.deletedTasksCount).toBe(3);

      // Verify Task.deleteMany was invoked with project and user filter
      expect(Task.deleteMany).toHaveBeenCalledWith({ projectId: 1, userId });
      // Verify MySQL project delete was parameterized
      expect(mysql.query).toHaveBeenCalledWith(
        'DELETE FROM projects WHERE id = ? AND user_id = ?',
        [1, userId]
      );
    });
  });
});

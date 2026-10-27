const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

jest.mock('../src/config/mysql');
jest.mock('../src/models/task.model');

const mysql = require('../src/config/mysql');
const Task = require('../src/models/task.model');
const config = require('../src/config/env');
const app = require('../src/app');

describe('Task Management API (/api/tasks)', () => {
  const userId = 10;
  const userToken = jwt.sign({ userId, email: 'user10@example.com' }, config.jwt.secret);

  const otherUserId = 20;
  const otherUserToken = jwt.sign({ userId: otherUserId, email: 'user20@example.com' }, config.jwt.secret);

  const validObjectId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tasks', () => {
    it('should create a task when referenced project exists and belongs to user', async () => {
      // 1. Auth middleware check
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);
      // 2. Project ownership check
      mysql.query.mockResolvedValueOnce([[{ id: 1 }]]);

      // Mock Task constructor and save
      const mockSavedTask = {
        _id: validObjectId,
        title: 'Implement Equalizer',
        description: 'DSP EQ filter',
        projectId: 1,
        userId: userId,
        status: 'todo',
        priority: 'high',
        dueDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        toJSON: function() { return { ...this }; }
      };

      Task.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedTask)
      }));

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Implement Equalizer',
          description: 'DSP EQ filter',
          projectId: 1,
          status: 'todo',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Implement Equalizer');
      expect(res.body.data.task.userId).toBe(userId);
      expect(res.body.data.task.projectId).toBe(1);
    });

    it('should reject task creation if referenced project does not belong to user (404)', async () => {
      // Auth ok
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);
      // Project ownership check returns empty array
      mysql.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Malicious Task',
          projectId: 999
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Referenced project does not exist');
    });

    it('should reject invalid status and priority enum values with 422', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Task',
          projectId: 1,
          status: 'non_existent_status',
          priority: 'urgent_super'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/tasks (Filtering & Pagination)', () => {
    it('should return tasks with pagination metadata and respect filters', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);

      const mockTasks = [
        { _id: validObjectId, title: 'Task 1', status: 'todo', priority: 'high', projectId: 1, userId }
      ];

      Task.countDocuments.mockResolvedValueOnce(1);
      Task.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTasks)
      });

      const res = await request(app)
        .get('/api/tasks?page=1&limit=10&status=todo&priority=high&projectId=1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalRecords: 1,
        totalPages: 1
      });

      // Verify that query was scoped to user and filters
      expect(Task.countDocuments).toHaveBeenCalledWith({
        userId,
        status: 'todo',
        priority: 'high',
        projectId: 1
      });
    });

    it('should reject invalid or unsupported query parameters with 422', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);

      const res = await request(app)
        .get('/api/tasks?invalidParam=hack')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toContain('Unsupported query parameter');
    });

    it('should return empty list with totalRecords: 0 and totalPages: 0 when no tasks match', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);

      Task.countDocuments.mockResolvedValueOnce(0);
      Task.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      const res = await request(app)
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalRecords: 0,
        totalPages: 0
      });
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return 400 for invalid MongoDB ObjectId format', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);

      const res = await request(app)
        .get('/api/tasks/not-a-valid-object-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(422); // express-validator custom check
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toContain('Invalid task ID format');
    });

    it('should return 404 when task belongs to another user', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: otherUserId, name: 'Other', email: 'user20@example.com' }]]);
      Task.findOne.mockResolvedValueOnce(null);

      const res = await request(app)
        .get(`/api/tasks/${validObjectId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Task not found');
      expect(Task.findOne).toHaveBeenCalledWith({ _id: validObjectId, userId: otherUserId });
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task and verify project ownership if projectId is changed', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]); // Auth

      const existingTask = {
        _id: validObjectId,
        title: 'Old Title',
        projectId: 1,
        userId,
        save: jest.fn().mockResolvedValue({
          _id: validObjectId,
          title: 'New Title',
          projectId: 2,
          userId
        })
      };

      Task.findOne.mockResolvedValueOnce(existingTask);
      // New project ownership check
      mysql.query.mockResolvedValueOnce([[{ id: 2 }]]);

      const res = await request(app)
        .put(`/api/tasks/${validObjectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'New Title',
          projectId: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('New Title');
      expect(existingTask.projectId).toBe(2);
    });

    it('should reject reassignment to another user project (404)', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);

      const existingTask = {
        _id: validObjectId,
        title: 'Old Title',
        projectId: 1,
        userId
      };

      Task.findOne.mockResolvedValueOnce(existingTask);
      // New project not owned by user
      mysql.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .put(`/api/tasks/${validObjectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ projectId: 999 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Referenced project does not exist');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task if owned by user', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: userId, name: 'Owner', email: 'user10@example.com' }]]);
      Task.findOneAndDelete.mockResolvedValueOnce({ _id: validObjectId, userId });

      const res = await request(app)
        .delete(`/api/tasks/${validObjectId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validObjectId);
      expect(Task.findOneAndDelete).toHaveBeenCalledWith({ _id: validObjectId, userId });
    });

    it('should return 404 when deleting non-existent or other user task', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: otherUserId, name: 'Other', email: 'user20@example.com' }]]);
      Task.findOneAndDelete.mockResolvedValueOnce(null);

      const res = await request(app)
        .delete(`/api/tasks/${validObjectId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Task not found');
    });
  });
});

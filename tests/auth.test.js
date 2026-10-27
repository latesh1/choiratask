const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock MySQL module
jest.mock('../src/config/mysql');
const mysql = require('../src/config/mysql');
const config = require('../src/config/env');
const app = require('../src/app');

describe('Authentication API (/api/auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with hashed password', async () => {
      // Mock duplicate check returning empty array
      mysql.query
        .mockResolvedValueOnce([[]]) // Duplicate check
        .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT result

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBe(1);
      expect(res.body.data.user.name).toBe('Jane Doe');
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.password_hash).toBeUndefined();

      // Verify that bcrypt hashing was used
      const insertCallArgs = mysql.query.mock.calls[1][1];
      const savedHash = insertCallArgs[2];
      expect(savedHash).not.toBe('Password123');
      const isMatch = await bcrypt.compare('Password123', savedHash);
      expect(isMatch).toBe(true);
    });

    it('should reject registration if email is already registered (409 Conflict)', async () => {
      mysql.query.mockResolvedValueOnce([[{ id: 1, email: 'duplicate@example.com' }]]);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'duplicate@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('An account with this email already exists');
    });

    it('should return 422 if required fields are missing or invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials and return JWT', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      mysql.query.mockResolvedValueOnce([[
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          password_hash: hashedPassword
        }
      ]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'CorrectPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.user.id).toBe(1);
      expect(res.body.data.token).toBeDefined();

      // Verify JWT payload
      const decoded = jwt.verify(res.body.data.token, config.jwt.secret);
      expect(decoded.userId).toBe(1);
    });

    it('should fail with generic 401 when email does not exist', async () => {
      mysql.query.mockResolvedValueOnce([[]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should fail with generic 401 when password does not match', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      mysql.query.mockResolvedValueOnce([[
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          password_hash: hashedPassword
        }
      ]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('Protected Auth Endpoints (JWT Verification)', () => {
    it('should return 401 if Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication required');
    });

    it('should return 401 if token is invalid or corrupted', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid authentication token.');
    });

    it('should return authenticated user profile on GET /api/auth/me', async () => {
      const token = jwt.sign({ userId: 1, email: 'jane@example.com' }, config.jwt.secret);

      // Auth middleware user lookup, then service profile lookup
      mysql.query
        .mockResolvedValueOnce([[{ id: 1, name: 'Jane Doe', email: 'jane@example.com' }]])
        .mockResolvedValueOnce([[
          {
            id: 1,
            name: 'Jane Doe',
            email: 'jane@example.com',
            created_at: '2026-01-01',
            updated_at: '2026-01-01'
          }
        ]]);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(1);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('should update authenticated user profile on PUT /api/auth/profile', async () => {
      const token = jwt.sign({ userId: 1, email: 'jane@example.com' }, config.jwt.secret);

      mysql.query
        .mockResolvedValueOnce([[{ id: 1, name: 'Jane Doe', email: 'jane@example.com' }]]) // Auth middleware
        .mockResolvedValueOnce([[]]) // Duplicate check for new email
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE query
        .mockResolvedValueOnce([[
          { id: 1, name: 'Jane Updated', email: 'updated@example.com', created_at: '2026-01-01', updated_at: '2026-01-02' }
        ]]); // Fetch updated user

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Jane Updated',
          email: 'updated@example.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Jane Updated');
      expect(res.body.data.user.email).toBe('updated@example.com');
    });
  });
});

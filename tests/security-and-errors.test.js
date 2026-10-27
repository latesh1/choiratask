const request = require('supertest');
const app = require('../src/app');

describe('Security & Error Handling', () => {
  it('should return JSON 404 for undefined routes', async () => {
    const res = await request(app).get('/api/unknown-endpoint-xyz');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Route not found');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('should return health check information on GET /health', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  it('should handle malformed JSON payload with 400 status', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name": "Broken JSON, invalid payload');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Malformed JSON');
  });
});

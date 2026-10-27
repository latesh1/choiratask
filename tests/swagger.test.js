const request = require('supertest');
const app = require('../src/app');

describe('Swagger Documentation Endpoints', () => {
  it('GET /api-docs.json should return valid OpenAPI 3.0.3 JSON specification', async () => {
    const res = await request(app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('Choira MusicTech');
    expect(res.body.paths['/api/auth/register']).toBeDefined();
    expect(res.body.paths['/api/auth/login']).toBeDefined();
    expect(res.body.paths['/api/projects']).toBeDefined();
    expect(res.body.paths['/api/tasks']).toBeDefined();
    expect(res.body.paths['/api/dashboard']).toBeDefined();
    expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
  });

  it('GET /api-docs should redirect or serve Swagger UI HTML', async () => {
    const res = await request(app).get('/api-docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
  });
});

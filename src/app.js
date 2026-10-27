const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');

// Swagger UI and documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Import middleware
const notFoundHandler = require('./middleware/not-found.middleware');
const errorHandler = require('./middleware/error.middleware');
const { sendSuccess } = require('./utils/responses');

const app = express();

// Security and HTTP headers (disable CSP so Swagger UI assets load cleanly)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration
app.use(cors({
  origin: config.cors.origin === '*' ? '*' : config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Swagger Documentation Routes
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(swaggerSpec);
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Choira MusicTech — API Documentation',
    swaggerOptions: {
      persistAuthorization: true
    }
  })
);

// Base / Health check route
app.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'Service is healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

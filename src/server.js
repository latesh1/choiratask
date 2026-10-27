const app = require('./app');
const config = require('./config/env');
const { connectMySQL, closeMySQL } = require('./config/mysql');
const { connectMongoDB, closeMongoDB } = require('./config/mongodb');

let server = null;

/**
 * Start the application: connects to MySQL and MongoDB, then starts Express HTTP listener.
 */
const startServer = async () => {
  try {
    console.log('----------------------------------------------------');
    console.log('Choira Project & Task Management API');
    console.log(`Environment: ${config.nodeEnv}`);
    console.log('----------------------------------------------------');

    console.log('[Startup] Connecting to MySQL...');
    await connectMySQL();

    console.log('[Startup] Connecting to MongoDB...');
    await connectMongoDB();

    console.log('[Startup] Database connections established.');

    server = app.listen(config.port, () => {
      console.log(`[Server] HTTP server is listening on port ${config.port}`);
      console.log(`[Health] Health check available at http://localhost:${config.port}/health`);
      console.log('----------------------------------------------------');
    });

    return server;
  } catch (error) {
    console.error(`[Startup Fatal] Server initialization failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully shut down server and close database connections.
 * @param {string} signal
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n[Shutdown] Received ${signal}. Initiating graceful termination...`);

  if (server) {
    server.close(async () => {
      console.log('[Shutdown] Closed active HTTP listeners.');
      await closeMySQL();
      await closeMongoDB();
      console.log('[Shutdown] All connections terminated cleanly. Exiting.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown takes too long
    setTimeout(() => {
      console.error('[Shutdown] Forceful shutdown initiated after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  gracefulShutdown
};

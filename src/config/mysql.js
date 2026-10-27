const mysql = require('mysql2/promise');
const config = require('./env');

let pool = null;

/**
 * Get or initialize MySQL connection pool.
 */
const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      waitForConnections: config.mysql.waitForConnections,
      connectionLimit: config.mysql.connectionLimit,
      queueLimit: config.mysql.queueLimit,
      charset: 'utf8mb4'
    });
  }
  return pool;
};

/**
 * Verify MySQL connectivity.
 */
const connectMySQL = async () => {
  try {
    const currentPool = getPool();
    const connection = await currentPool.getConnection();
    await connection.ping();
    connection.release();
    console.log(`[MySQL] Connected successfully to database "${config.mysql.database}" on ${config.mysql.host}:${config.mysql.port}`);
    return true;
  } catch (error) {
    console.error(`[MySQL] Connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Execute a parameterized SQL query.
 * @param {string} sql - Parameterized SQL statement
 * @param {Array} params - Array of parameters
 */
const query = async (sql, params = []) => {
  const currentPool = getPool();
  return currentPool.execute(sql, params);
};

/**
 * Gracefully close MySQL connection pool.
 */
const closeMySQL = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[MySQL] Connection pool closed.');
  }
};

/**
 * Override pool for testing or mocking.
 * @param {object} mockPool
 */
const setPool = (mockPool) => {
  pool = mockPool;
};

module.exports = {
  getPool,
  connectMySQL,
  query,
  closeMySQL,
  setPool
};

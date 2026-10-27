require('dotenv').config();

const requiredEnvVars = [
  'JWT_SECRET',
  'MYSQL_HOST',
  'MYSQL_USER',
  'MYSQL_DATABASE',
  'MONGODB_URI'
];

// Check for missing mandatory variables
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error(`[FATAL] Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file or copy from .env.example');
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'test_jwt_secret_key_minimum_32_characters_choira',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10
  },
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'choira_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/choira_db'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};

module.exports = config;

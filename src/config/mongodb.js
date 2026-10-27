const mongoose = require('mongoose');
const config = require('./env');

/**
 * Connect to MongoDB using Mongoose.
 */
const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Gracefully close MongoDB connection.
 */
const closeMongoDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed.');
    }
  } catch (error) {
    console.error(`[MongoDB] Error closing connection: ${error.message}`);
  }
};

module.exports = {
  connectMongoDB,
  closeMongoDB
};

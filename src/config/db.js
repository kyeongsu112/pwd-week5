// src/config/db.js
const mongoose = require('mongoose');

async function connectDB(uri, dbName) {
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Set it in environment variables.');
  }
  await mongoose.connect(uri, {
    dbName,
    autoIndex: process.env.NODE_ENV !== 'production',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });
  mongoose.connection.on('connected', () => {
    console.log(`[MongoDB] connected: ${mongoose.connection.name}`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] connection error:', err);
  });
}

async function closeDB() {
  try {
    await mongoose.connection.close(false);
    console.log('[MongoDB] connection closed');
  } catch (err) {
    console.error('[MongoDB] error on close:', err);
  }
}

module.exports = { connectDB, closeDB };
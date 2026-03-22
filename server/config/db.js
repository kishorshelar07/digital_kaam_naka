/**
 * config/db.js — MongoDB Database Configuration (Mongoose)
 * Converted from PostgreSQL + Sequelize → MongoDB + Mongoose
 * Author: Digital Kaam Naka Dev Team
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB...');

    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/kaamnaka_db';

    await mongoose.connect(mongoUri, {
      // Mongoose 7+ does not need these options, but keeping for clarity
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
    logger.info(`✅ Connected to database: ${mongoose.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB, mongoose };

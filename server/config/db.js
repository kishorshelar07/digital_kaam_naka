/**
 * config/db.js — Database Configuration
 * Author: Digital Kaam Naka Dev Team
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'kaamnaka_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',

    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000,
    },

    logging: false,

    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },

    define: {
      underscored:    true,
      timestamps:     true,
      freezeTableName: true,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      logger.info('✅ PostGIS extension enabled');
    } catch (postgisErr) {
      logger.warn('PostGIS not available:', postgisErr.message);
    }

    // ❌ NO sync in production — schema already created via schema.sql
    if (process.env.NODE_ENV === 'development') {
      logger.info('✅ Database ready — development mode');
    } else {
      logger.info('✅ Database ready — production mode');
    }

  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.error('Host:', process.env.DB_HOST);
    logger.error('Database:', process.env.DB_NAME);
    logger.error('User:', process.env.DB_USER);
    logger.error('SSL:', process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
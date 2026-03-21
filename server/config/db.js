/**
 * config/db.js — Database Configuration
 * PostgreSQL connection via Sequelize ORM
 * Author: Digital Kaam Naka Dev Team
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'kaamnaka_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    // Only log SQL in development
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
    define: {
      underscored: true,
      timestamps: true,
      freezeTableName: true,
    },
  }
);

/**
 * @desc    Connect to PostgreSQL database
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    // Enable PostGIS for GPS queries
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    logger.info('✅ PostGIS extension enabled');

    // ❌ DO NOT use sync({ alter: true }) — tables already exist from schema.sql
    // sync({ alter: true }) conflicts with existing enum types
    // Tables were created via: psql -f database/schema.sql
    logger.info('✅ Database ready — using existing schema');

  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.error('Check: DB_NAME, DB_USER, DB_PASS in .env file');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
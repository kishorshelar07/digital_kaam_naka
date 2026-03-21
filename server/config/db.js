/**
 * config/db.js — Database Configuration
 * Uses DATABASE_URL for production (Render + Supabase)
 * Author: Digital Kaam Naka Dev Team
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize;

// Production: use DATABASE_URL directly
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    define: {
      underscored: true,
      timestamps: true,
      freezeTableName: true,
    },
  });
} else {
  // Development: use individual env vars
  sequelize = new Sequelize(
    process.env.DB_NAME || 'kaamnaka_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '',
    {
      host:    process.env.DB_HOST || 'localhost',
      port:    parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false,
      pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
      dialectOptions: { ssl: false },
      define: {
        underscored: true,
        timestamps: true,
        freezeTableName: true,
      },
    }
  );
}

const connectDB = async () => {
  try {
    logger.info('Connecting to database...');
    logger.info('Using DATABASE_URL:', process.env.DATABASE_URL ? 'YES' : 'NO');

    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      logger.info('✅ PostGIS extension enabled');
    } catch (e) {
      logger.warn('PostGIS skip:', e.message);
    }

    logger.info('✅ Database ready');

  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.error('DATABASE_URL set:', !!process.env.DATABASE_URL);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
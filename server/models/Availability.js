/**
 * ================================================================
 * models/Availability.js — Worker Availability Model (TABLE 6)
 * Tracks when and where a worker is available each day.
 * This is the CORE of the digital Naka system —
 * workers set availability from home, employers see it in real-time.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Availability = sequelize.define('Availability', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  workerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'worker_id',
    references: { model: 'workers', key: 'id' },
    onDelete: 'CASCADE',
  },

  // Date for which this availability is set
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_available',
  },

  // Working hours window (default: 6 AM to 8 PM)
  startTime: {
    type: DataTypes.TIME,
    defaultValue: '06:00:00',
    field: 'start_time',
  },

  endTime: {
    type: DataTypes.TIME,
    defaultValue: '20:00:00',
    field: 'end_time',
  },

  // Worker's GPS when they marked themselves available
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },

  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },

  // How far worker is willing to travel from their location
  radiusKm: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    field: 'radius_km',
    validate: {
      min: { args: [1], msg: 'Radius must be at least 1 km' },
      max: { args: [200], msg: 'Radius cannot exceed 200 km' },
    },
  },

  // Specific work types available for this day (optional)
  availableForCategories: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: 'available_for_categories',
  },

  // Note for this availability (e.g. "available only after 9 AM")
  note: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
}, {
  tableName: 'availability',
  timestamps: true,
  updatedAt: false,
  underscored: true,

  indexes: [
    // Compound index for fast "who is available today near me" queries
    { fields: ['worker_id', 'date'] },
    { fields: ['date', 'is_available'] },
  ],
});

module.exports = Availability;
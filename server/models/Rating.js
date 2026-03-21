/**
 * ================================================================
 * models/Rating.js — Rating/Review Model (TABLE 10)
 * Bidirectional rating system — employers rate workers AND
 * workers rate employers. Builds trust in the platform.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'booking_id',
    references: { model: 'bookings', key: 'id' },
  },

  // Who is giving the rating
  ratedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rated_by',
    references: { model: 'users', key: 'id' },
  },

  // Who is receiving the rating
  ratedTo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rated_to',
    references: { model: 'users', key: 'id' },
  },

  // Whether the person being rated is worker or employer
  roleRatedTo: {
    type: DataTypes.ENUM('worker', 'employer'),
    allowNull: false,
    field: 'role_rated_to',
  },

  // 1-5 star rating
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Rating must be at least 1 star' },
      max: { args: [5], msg: 'Rating cannot exceed 5 stars' },
    },
  },

  // Written review (optional but encouraged)
  review: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: { args: [0, 1000], msg: 'Review cannot exceed 1000 characters' },
    },
  },

  // Admin can hide inappropriate reviews
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_visible',
  },

  // Flag for admin review
  isFlagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_flagged',
  },

  flagReason: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'flag_reason',
  },
}, {
  tableName: 'ratings',
  timestamps: true,
  underscored: true,
  updatedAt: false,

  indexes: [
    // Ensure one rating per person per booking
    {
      unique: true,
      fields: ['booking_id', 'rated_by', 'rated_to'],
    },
    { fields: ['rated_to', 'role_rated_to', 'is_visible'] },
  ],
});

module.exports = Rating;

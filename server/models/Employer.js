/**
 * ================================================================
 * models/Employer.js — Employer Profile Model (TABLE 3)
 * Extends User with employer data: company info, hiring stats,
 * subscription tier, and address details.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Employer = sequelize.define('Employer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },

  // Optional — individuals hiring one worker may leave blank
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'company_name',
  },

  // Type helps workers understand what kind of work to expect
  employerType: {
    type: DataTypes.ENUM('individual', 'contractor', 'farmer', 'business'),
    defaultValue: 'individual',
    field: 'employer_type',
  },

  // GST for business employers (optional)
  gstNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'gst_number',
    validate: {
      is: {
        args: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        msg: 'Enter a valid GST number',
      },
    },
  },

  avgRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    field: 'avg_rating',
    validate: { min: 0, max: 5 },
  },

  // Total job posts ever created
  totalPosts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_posts',
  },

  // Total workers successfully hired
  totalHires: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_hires',
  },

  // Address fields
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  district: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  state: {
    type: DataTypes.STRING(50),
    defaultValue: 'Maharashtra',
  },

  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      is: { args: /^\d{6}$/, msg: 'Pincode must be 6 digits' },
    },
  },

  // Latitude/longitude for "Workers Near Me" map view
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },

  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },

  // Total amount spent on hiring (for analytics)
  totalSpent: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_spent',
  },
}, {
  tableName: 'employers',
  timestamps: true,
  underscored: true,
});

module.exports = Employer;

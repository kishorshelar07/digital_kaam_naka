/**
 * ================================================================
 * models/JobPost.js — Job Post Model (TABLE 7)
 * Employers post jobs here. This is the digital equivalent of an
 * employer arriving at the Naka and announcing what work they need.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const JobPost = sequelize.define('JobPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  employerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employer_id',
    references: { model: 'employers', key: 'id' },
    onDelete: 'CASCADE',
  },

  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: { model: 'categories', key: 'id' },
  },

  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Job title is required' },
      len: { args: [5, 200], msg: 'Title must be 5-200 characters' },
    },
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // How many workers needed for this job
  workersNeeded: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'workers_needed',
    validate: {
      min: { args: [1], msg: 'At least 1 worker needed' },
      max: { args: [500], msg: 'Cannot hire more than 500 workers per post' },
    },
  },

  // How many workers have been confirmed so far
  workersBooked: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'workers_booked',
  },

  // Rate offered by employer (INR per day)
  dailyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'daily_rate',
    validate: {
      min: { args: [100], msg: 'Daily rate must be at least ₹100' },
    },
  },

  // When does the work start
  jobDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'job_date',
    validate: {
      isAfterToday(value) {
        if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
          throw new Error('Job date cannot be in the past');
        }
      },
    },
  },

  // For multi-day jobs
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date',
  },

  durationDays: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'duration_days',
    validate: {
      min: { args: [1], msg: 'Duration must be at least 1 day' },
      max: { args: [365], msg: 'Duration cannot exceed 365 days' },
    },
  },

  jobType: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    defaultValue: 'daily',
    field: 'job_type',
  },

  // GPS location of the work site
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },

  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },

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
  },

  // Urgent flag — triggers push notification to nearby workers
  isUrgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_urgent',
  },

  status: {
    type: DataTypes.ENUM('open', 'partially_filled', 'filled', 'completed', 'cancelled'),
    defaultValue: 'open',
  },

  // Track how many times job was viewed
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'views_count',
  },

  // Photos of the work site (Cloudinary URLs)
  sitePhotos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'site_photos',
  },

  // Additional requirements (tools needed, physical requirements, etc.)
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'job_posts',
  timestamps: true,
  underscored: true,

  indexes: [
    { fields: ['employer_id'] },
    { fields: ['category_id'] },
    { fields: ['status'] },
    { fields: ['job_date'] },
    { fields: ['district'] },
    { fields: ['is_urgent'] },
    // Spatial index for GPS queries (PostGIS handles this)
    { fields: ['latitude', 'longitude'] },
  ],
});

/**
 * @desc    Check if job post still has open slots
 * @returns {boolean} true if more workers can be booked
 */
JobPost.prototype.hasOpenSlots = function () {
  return this.workersBooked < this.workersNeeded;
};

/**
 * @desc    Calculate total job cost (days × rate × workers)
 * @returns {number} Total amount in INR
 */
JobPost.prototype.totalCost = function () {
  return this.durationDays * this.dailyRate * this.workersNeeded;
};

module.exports = JobPost;

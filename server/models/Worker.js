/**
 * ================================================================
 * models/Worker.js — Worker Profile Model (TABLE 2)
 * Extends User with worker-specific data: skills, rates, location,
 * availability toggle, and Aadhar verification info.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Worker = sequelize.define('Worker', {
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

  // Government ID for identity verification
  aadharNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'aadhar_number',
    validate: {
      is: {
        args: /^\d{12}$/,
        msg: 'Aadhar number must be 12 digits',
      },
    },
  },

  aadharPhoto: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'aadhar_photo', // Cloudinary URL
  },

  // How much worker charges per day in INR
  dailyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'daily_rate',
    validate: {
      min: { args: [100], msg: 'Daily rate must be at least ₹100' },
      max: { args: [50000], msg: 'Daily rate cannot exceed ₹50,000' },
    },
  },

  experienceYrs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'experience_yrs',
    validate: {
      min: { args: [0], msg: 'Experience cannot be negative' },
      max: { args: [50], msg: 'Experience cannot exceed 50 years' },
    },
  },

  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: { args: [0, 500], msg: 'Bio cannot exceed 500 characters' },
    },
  },

  // Cumulative stats — updated after each booking
  totalJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_jobs',
  },

  avgRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    field: 'avg_rating',
    validate: {
      min: 0,
      max: 5,
    },
  },

  // ── THE CORE FEATURE: "Aaj Uplabdh Ahe" toggle ───────────
  // Worker turns this ON in morning → employers can find them
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_available',
  },

  // Admin verifies Aadhar → verified badge shown on profile
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
  },

  // Current GPS coordinates (updated when availability is toggled ON)
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90,
    },
  },

  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180,
    },
  },

  // Address fields for Maharashtra-specific search
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  taluka: {
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
      is: {
        args: /^\d{6}$/,
        msg: 'Pincode must be 6 digits',
      },
    },
  },

  // Total earnings on platform (for analytics)
  totalEarnings: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_earnings',
  },
}, {
  tableName: 'workers',
  timestamps: true,
  underscored: true,
});

/**
 * @desc    Calculate distance from a given point using Haversine formula
 * @param   {number} lat - Reference latitude
 * @param   {number} lng - Reference longitude
 * @returns {number} Distance in kilometers
 */
Worker.prototype.distanceFrom = function (lat, lng) {
  if (!this.latitude || !this.longitude) return null;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat - this.latitude);
  const dLng = toRad(lng - this.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(this.latitude)) * Math.cos(toRad(lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

const toRad = (deg) => (deg * Math.PI) / 180;

module.exports = Worker;

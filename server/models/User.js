/**
 * ================================================================
 * models/User.js — User Model (TABLE 1)
 * Central auth table. Every person on the platform is a User.
 * Workers and Employers are extensions of this record.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' },
      len: { args: [2, 100], msg: 'Name must be 2-100 characters' },
    },
  },

  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: { msg: 'Phone number already registered' },
    validate: {
      is: {
        args: /^[6-9]\d{9}$/,
        msg: 'Enter a valid 10-digit Indian mobile number',
      },
    },
  },

  email: {
    type: DataTypes.STRING(100),
    unique: { msg: 'Email already registered' },
    allowNull: true,
    validate: {
      isEmail: { msg: 'Enter a valid email address' },
    },
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // null = OTP-only login
  },

  role: {
    type: DataTypes.ENUM('worker', 'employer', 'admin'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['worker', 'employer', 'admin']],
        msg: 'Role must be worker, employer, or admin',
      },
    },
  },

  // Preferred language for notifications and UI
  language: {
    type: DataTypes.STRING(20),
    defaultValue: 'mr', // Marathi is default
    validate: {
      isIn: {
        args: [['mr', 'hi', 'en', 'gu']],
        msg: 'Language must be mr, hi, en, or gu',
      },
    },
  },

  profilePhoto: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'profile_photo',
  },

  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },

  // OTP for phone-based login
  otp: {
    type: DataTypes.STRING(6),
    allowNull: true,
  },

  otpExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'otp_expires',
  },

  // Track failed OTP attempts to block brute force
  otpAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'otp_attempts',
  },

  // Block OTP login until this time (after 3 failed attempts)
  otpBlockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'otp_blocked_until',
  },

  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login',
  },

  // FCM token for push notifications
  fcmToken: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'fcm_token',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,

  // Never return password or OTP fields in API responses
  defaultScope: {
    attributes: {
      exclude: ['password', 'otp', 'otpExpires', 'otpAttempts', 'otpBlockedUntil', 'fcmToken'],
    },
  },

  // Named scopes for different use cases
  scopes: {
    // Include password — only for auth operations
    withPassword: {
      attributes: { include: ['password'] },
    },
    // Include OTP — only for OTP verification
    withOtp: {
      attributes: { include: ['otp', 'otpExpires', 'otpAttempts', 'otpBlockedUntil'] },
    },
    // Include FCM token — only for push notifications
    withFcm: {
      attributes: { include: ['fcmToken'] },
    },
    // Admin scope — include everything
    admin: {
      attributes: { include: ['password', 'otp', 'otpExpires', 'otpAttempts'] },
    },
  },
});

// ── Instance Methods ──────────────────────────────────────────

/**
 * @desc    Hash password before saving to database
 */
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password') && user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

/**
 * @desc    Compare entered password with hashed password in DB
 * @param   {string} enteredPassword - Plain text password from user
 * @returns {Promise<boolean>} true if match, false if not
 */
User.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * @desc    Check if OTP is valid (not expired, not exceeded attempts)
 * @param   {string} enteredOtp - OTP entered by user
 * @returns {Object} { valid: boolean, reason: string }
 */
User.prototype.verifyOtp = function (enteredOtp) {
  // Check if user is blocked
  if (this.otpBlockedUntil && new Date() < new Date(this.otpBlockedUntil)) {
    const minsLeft = Math.ceil((new Date(this.otpBlockedUntil) - new Date()) / 60000);
    return { valid: false, reason: `Too many attempts. Try again in ${minsLeft} minutes.` };
  }

  // Check if OTP exists
  if (!this.otp) {
    return { valid: false, reason: 'No OTP found. Please request a new one.' };
  }

  // Check if OTP is expired
  if (new Date() > new Date(this.otpExpires)) {
    return { valid: false, reason: 'OTP expired. Please request a new one.' };
  }

  // Check if OTP matches
  if (this.otp !== enteredOtp) {
    return { valid: false, reason: 'Invalid OTP. Please try again.' };
  }

  return { valid: true, reason: 'OTP verified' };
};

module.exports = User;

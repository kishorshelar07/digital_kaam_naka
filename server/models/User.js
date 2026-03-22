/**
 * ================================================================
 * models/User.js — User Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Central auth collection. Every person on the platform is a User.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values (unlike SQL unique)
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
      trim: true,
    },

    // null = OTP-only login
    password: {
      type: String,
      select: false, // Never returned in queries by default
      minlength: 6,
    },

    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['worker', 'employer', 'admin'],
        message: 'Role must be worker, employer, or admin',
      },
    },

    // Preferred language for notifications and UI
    language: {
      type: String,
      default: 'mr', // Marathi is default
      enum: {
        values: ['mr', 'hi', 'en', 'gu'],
        message: 'Language must be mr, hi, en, or gu',
      },
    },

    profilePhoto: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // OTP for phone-based login (select: false — hidden by default)
    otp: {
      type: String,
      select: false,
    },

    otpExpires: {
      type: Date,
      select: false,
    },

    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    otpBlockedUntil: {
      type: Date,
      default: null,
      select: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // FCM token for push notifications
    fcmToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    collection: 'users',
  }
);

// ── Indexes ───────────────────────────────────────────────────
// NOTE: phone and email indexes are already created via `unique: true` and `sparse: true`
// in the schema field definitions above — no need to repeat them here.
UserSchema.index({ role: 1 });

// ── Hooks (Pre-save password hashing) ─────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Methods ──────────────────────────────────────────

/**
 * Compare entered password with hashed password
 */
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * Verify OTP — checks expiry, attempts, block status
 */
UserSchema.methods.verifyOtp = function (enteredOtp) {
  if (this.otpBlockedUntil && new Date() < new Date(this.otpBlockedUntil)) {
    const minsLeft = Math.ceil((new Date(this.otpBlockedUntil) - new Date()) / 60000);
    return { valid: false, reason: `Too many attempts. Try again in ${minsLeft} minutes.` };
  }
  if (!this.otp) {
    return { valid: false, reason: 'No OTP found. Please request a new one.' };
  }
  if (new Date() > new Date(this.otpExpires)) {
    return { valid: false, reason: 'OTP expired. Please request a new one.' };
  }
  if (this.otp !== enteredOtp) {
    return { valid: false, reason: 'Invalid OTP. Please try again.' };
  }
  return { valid: true, reason: 'OTP verified' };
};

module.exports = mongoose.model('User', UserSchema);

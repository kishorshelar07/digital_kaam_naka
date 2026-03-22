/**
 * ================================================================
 * models/JobPost.js — Job Post Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const JobPostSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'Job title is required'],
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
    },

    description: { type: String, default: null },

    workersNeeded: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 worker needed'],
      max: [500, 'Cannot hire more than 500 workers per post'],
    },

    workersBooked: { type: Number, default: 0 },

    dailyRate: {
      type: Number,
      required: [true, 'Daily rate is required'],
      min: [100, 'Daily rate must be at least ₹100'],
    },

    jobDate: {
      type: Date,
      required: [true, 'Job date is required'],
    },

    endDate: { type: Date, default: null },

    durationDays: {
      type: Number,
      default: 1,
      min: [1, 'Duration must be at least 1 day'],
      max: [365, 'Duration cannot exceed 365 days'],
    },

    jobType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
    },

    // GeoJSON Point for GPS-based job search
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    address: { type: String, default: null },
    city: { type: String, default: null },
    district: { type: String, default: null },
    state: { type: String, default: 'Maharashtra' },
    pincode: { type: String, default: null },

    isUrgent: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['open', 'partially_filled', 'filled', 'completed', 'cancelled'],
      default: 'open',
    },

    viewsCount: { type: Number, default: 0 },

    // Cloudinary photo URLs (replaces ARRAY(DataTypes.STRING))
    sitePhotos: [{ type: String }],

    requirements: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'job_posts',
  }
);

// ── Indexes ───────────────────────────────────────────────────
JobPostSchema.index({ employerId: 1 });
JobPostSchema.index({ categoryId: 1 });
JobPostSchema.index({ status: 1 });
JobPostSchema.index({ jobDate: 1 });
JobPostSchema.index({ district: 1 });
JobPostSchema.index({ isUrgent: 1 });
JobPostSchema.index({ location: '2dsphere' }); // Replaces PostGIS spatial index

// ── Instance Methods ──────────────────────────────────────────
JobPostSchema.methods.hasOpenSlots = function () {
  return this.workersBooked < this.workersNeeded;
};

JobPostSchema.methods.totalCost = function () {
  return this.durationDays * this.dailyRate * this.workersNeeded;
};

module.exports = mongoose.model('JobPost', JobPostSchema);

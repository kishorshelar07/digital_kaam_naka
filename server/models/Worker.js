/**
 * ================================================================
 * models/Worker.js — Worker Profile Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Extends User with worker-specific data.
 * GPS location stored as GeoJSON Point for $near queries.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    aadharNumber: {
      type: String,
      match: [/^\d{12}$/, 'Aadhar number must be 12 digits'],
      default: null,
    },

    aadharPhoto: {
      type: String, // Cloudinary URL
      default: null,
    },

    dailyRate: {
      type: Number,
      required: [true, 'Daily rate is required'],
      min: [100, 'Daily rate must be at least ₹100'],
      max: [50000, 'Daily rate cannot exceed ₹50,000'],
    },

    experienceYrs: {
      type: Number,
      default: 0,
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years'],
    },

    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },

    totalJobs: {
      type: Number,
      default: 0,
    },

    avgRating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5,
    },

    // ── THE CORE FEATURE: "Aaj Uplabdh Ahe" toggle ────────────
    isAvailable: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // GeoJSON Point for MongoDB $near / $geoWithin queries
    // REPLACES: PostGIS lat/lng columns
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — MongoDB convention
        default: undefined,
      },
    },

    // Keep flat lat/lng for convenience (populated alongside location)
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    address: { type: String, default: null },
    city: { type: String, default: null },
    taluka: { type: String, default: null },
    district: { type: String, default: null },
    state: { type: String, default: 'Maharashtra' },

    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
      default: null,
    },

    totalEarnings: {
      type: Number,
      default: 0.0,
    },
  },
  {
    timestamps: true,
    collection: 'workers',
  }
);

// ── Indexes ───────────────────────────────────────────────────

WorkerSchema.index({ location: '2dsphere' }); // For $near GPS queries
WorkerSchema.index({ isAvailable: 1 });
WorkerSchema.index({ district: 1 });
WorkerSchema.index({ avgRating: -1 });
WorkerSchema.index({ dailyRate: 1 });

// ── Instance Methods ──────────────────────────────────────────

/**
 * Calculate distance from a given point (Haversine formula)
 * Used as fallback when not using $near
 */
WorkerSchema.methods.distanceFrom = function (lat, lng) {
  if (!this.latitude || !this.longitude) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat - this.latitude);
  const dLng = toRad(lng - this.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(this.latitude)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

module.exports = mongoose.model('Worker', WorkerSchema);

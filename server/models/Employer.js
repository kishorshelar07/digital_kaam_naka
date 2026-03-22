/**
 * ================================================================
 * models/Employer.js — Employer Profile Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const EmployerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    companyName: { type: String, default: null },

    employerType: {
      type: String,
      enum: ['individual', 'contractor', 'farmer', 'business'],
      default: 'individual',
    },

    gstNumber: {
      type: String,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Enter a valid GST number',
      ],
      default: null,
    },

    avgRating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5,
    },

    totalPosts: { type: Number, default: 0 },
    totalHires: { type: Number, default: 0 },

    address: { type: String, default: null },
    city: { type: String, default: null },
    district: { type: String, default: null },
    state: { type: String, default: 'Maharashtra' },

    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
      default: null,
    },

    // GeoJSON Point for location-based queries
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    totalSpent: { type: Number, default: 0.0 },
  },
  {
    timestamps: true,
    collection: 'employers',
  }
);


EmployerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Employer', EmployerSchema);

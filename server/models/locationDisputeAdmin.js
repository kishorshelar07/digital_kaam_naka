/**
 * ================================================================
 * models/locationDisputeAdmin.js — Location & Dispute Models (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

// ── Location ──────────────────────────────────────────────────
const LocationSchema = new mongoose.Schema(
  {
    state: { type: String, default: 'Maharashtra' },
    district: { type: String, required: true },
    taluka: { type: String, default: null },
    city: { type: String, default: null },
    pincode: { type: String, default: null },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: false,
    collection: 'locations',
  }
);

LocationSchema.index({ location: '2dsphere' });
LocationSchema.index({ district: 1, taluka: 1 });

// ── Dispute ───────────────────────────────────────────────────
const DisputeSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    reason: { type: String, required: true },

    // Cloudinary evidence URLs (replaces ARRAY(DataTypes.STRING))
    evidenceUrls: [{ type: String }],

    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed'],
      default: 'open',
    },

    resolution: { type: String, default: null },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'disputes',
  }
);

DisputeSchema.index({ bookingId: 1 });
DisputeSchema.index({ raisedBy: 1 });
DisputeSchema.index({ status: 1 });

const Location = mongoose.model('Location', LocationSchema);
const Dispute = mongoose.model('Dispute', DisputeSchema);

module.exports = { Location, Dispute };

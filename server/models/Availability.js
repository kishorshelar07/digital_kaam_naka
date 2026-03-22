/**
 * ================================================================
 * models/Availability.js — Worker Availability Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
    },

    // Date for which this availability is set (store as Date, compare by day)
    date: {
      type: Date,
      required: true,
    },

    isAvailable: { type: Boolean, default: true },

    // Working hours window (stored as "HH:MM:SS" strings)
    startTime: { type: String, default: '06:00:00' },
    endTime: { type: String, default: '20:00:00' },

    // Worker's GPS when they marked themselves available
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    // GeoJSON for geo queries
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },

    radiusKm: {
      type: Number,
      default: 20,
      min: [1, 'Radius must be at least 1 km'],
      max: [200, 'Radius cannot exceed 200 km'],
    },

    // Specific category ObjectIds available for this day
    availableForCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
    ],

    note: { type: String, maxlength: 200, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'availability',
  }
);

AvailabilitySchema.index({ workerId: 1, date: 1 });
AvailabilitySchema.index({ date: 1, isAvailable: 1 });
AvailabilitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Availability', AvailabilitySchema);

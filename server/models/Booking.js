/**
 * ================================================================
 * models/Booking.js — Booking Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    jobPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      default: null,
    },

    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
    },

    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },

    /**
     * Booking Status Flow:
     * pending → accepted → started → completed
     *         ↘ rejected
     * (any stage) → cancelled / disputed
     */
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'started', 'completed', 'cancelled', 'disputed'],
      default: 'pending',
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    totalDays: { type: Number, default: 1 },

    agreedRate: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    workStartedAt: { type: Date, default: null },
    workEndedAt: { type: Date, default: null },

    // Work site GPS (captured when worker marks "started")
    workSiteLatitude: { type: Number, default: null },
    workSiteLongitude: { type: Number, default: null },

    cancelReason: { type: String, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: { type: Date, default: null },

    // Completion photos — replaces ARRAY(DataTypes.STRING)
    completionPhotos: [{ type: String }],

    bookingNote: { type: String, default: '' },

    ratingGivenToWorker: { type: Boolean, default: false },
    ratingGivenToEmployer: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'bookings',
  }
);

// ── Indexes ───────────────────────────────────────────────────
BookingSchema.index({ workerId: 1, status: 1 });
BookingSchema.index({ employerId: 1, status: 1 });
BookingSchema.index({ jobPostId: 1 });
BookingSchema.index({ startDate: 1 });
BookingSchema.index({ status: 1 });

// ── Instance Methods ──────────────────────────────────────────
BookingSchema.methods.canBeCancelled = function () {
  return ['pending', 'accepted'].includes(this.status);
};

BookingSchema.methods.canRatingBeGiven = function () {
  return this.status === 'completed';
};

module.exports = mongoose.model('Booking', BookingSchema);

/**
 * ================================================================
 * models/Rating.js — Rating/Review Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    ratedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    roleRatedTo: {
      type: String,
      enum: ['worker', 'employer'],
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },

    review: {
      type: String,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
      default: null,
    },

    isVisible: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'ratings',
  }
);

// Unique rating per person per booking (replaces SQL unique compound index)
RatingSchema.index({ bookingId: 1, ratedBy: 1, ratedTo: 1 }, { unique: true });
RatingSchema.index({ ratedTo: 1, roleRatedTo: 1, isVisible: 1 });

module.exports = mongoose.model('Rating', RatingSchema);

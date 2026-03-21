/**
 * ================================================================
 * models/Booking.js — Booking Model (TABLE 8)
 * The central transaction record — created when an employer selects
 * a worker. Tracks the full lifecycle from request to completion.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  jobPostId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = direct booking without a job post
    field: 'job_post_id',
    references: { model: 'job_posts', key: 'id' },
  },

  workerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'worker_id',
    references: { model: 'workers', key: 'id' },
  },

  employerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employer_id',
    references: { model: 'employers', key: 'id' },
  },

  /**
   * Booking Status Flow:
   * pending → accepted → started → completed
   *         ↘ rejected
   * (any stage) → cancelled
   */
  status: {
    type: DataTypes.ENUM(
      'pending',      // Employer sent request, worker hasn't responded
      'accepted',     // Worker accepted
      'rejected',     // Worker rejected
      'started',      // Worker marked work as started
      'completed',    // Work finished, payment due
      'cancelled',    // Either party cancelled
      'disputed'      // Dispute raised, under admin review
    ),
    defaultValue: 'pending',
  },

  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },

  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date',
  },

  totalDays: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'total_days',
  },

  // Rate agreed between worker and employer (may differ from posted rate)
  agreedRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'agreed_rate',
  },

  // Total amount (agreedRate × totalDays)
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount',
  },

  // Timestamps for actual work tracking
  workStartedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'work_started_at',
  },

  workEndedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'work_ended_at',
  },

  // Work site GPS (captured when worker marks "started")
  workSiteLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    field: 'work_site_latitude',
  },

  workSiteLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    field: 'work_site_longitude',
  },

  // Cancellation tracking
  cancelReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancel_reason',
  },

  cancelledBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'cancelled_by',
    references: { model: 'users', key: 'id' },
  },

  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
  },

  // Work completion photos (uploaded by employer)
  completionPhotos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'completion_photos',
  },

  // Message from employer to worker with booking request
  bookingNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'booking_note',
  },

  ratingGivenToWorker: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'rating_given_to_worker',
  },

  ratingGivenToEmployer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'rating_given_to_employer',
  },
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: true,

  indexes: [
    { fields: ['worker_id', 'status'] },
    { fields: ['employer_id', 'status'] },
    { fields: ['job_post_id'] },
    { fields: ['start_date'] },
    { fields: ['status'] },
  ],
});

/**
 * @desc    Check if booking can be cancelled
 * @returns {boolean} true if status allows cancellation
 */
Booking.prototype.canBeCancelled = function () {
  return ['pending', 'accepted'].includes(this.status);
};

/**
 * @desc    Check if rating can be given for this booking
 * @returns {boolean} true if work is completed
 */
Booking.prototype.canRatingBeGiven = function () {
  return this.status === 'completed';
};

module.exports = Booking;
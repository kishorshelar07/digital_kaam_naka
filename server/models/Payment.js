/**
 * ================================================================
 * models/Payment.js — Payment Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // One payment per booking
    },

    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },

    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
    },

    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0.0 },
    workerAmount: { type: Number, default: null },

    method: {
      type: String,
      enum: ['cash', 'upi', 'card', 'netbanking', 'wallet'],
      default: 'cash',
    },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },

    // Razorpay identifiers (null for cash payments)
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    transactionId: { type: String, default: null },

    paidAt: { type: Date, default: null },
    refundReason: { type: String, default: null },
    refundedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'payments',
  }
);


PaymentSchema.index({ workerId: 1 });
PaymentSchema.index({ employerId: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);

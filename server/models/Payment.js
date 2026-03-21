/**
 * ================================================================
 * models/Payment.js — Payment Model (TABLE 9)
 * Records every financial transaction. Integrates with Razorpay
 * for UPI/card payments, also tracks cash payments.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // One payment per booking
    field: 'booking_id',
    references: { model: 'bookings', key: 'id' },
  },

  employerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employer_id',
    references: { model: 'employers', key: 'id' },
  },

  workerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'worker_id',
    references: { model: 'workers', key: 'id' },
  },

  // Total amount charged to employer
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  // Platform fee (5% of amount)
  platformFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'platform_fee',
  },

  // Amount actually received by worker
  workerAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'worker_amount',
  },

  method: {
    type: DataTypes.ENUM('cash', 'upi', 'card', 'netbanking', 'wallet'),
    defaultValue: 'cash',
  },

  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending',
  },

  // Razorpay identifiers (null for cash payments)
  razorpayOrderId: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'razorpay_order_id',
  },

  razorpayPaymentId: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'razorpay_payment_id',
  },

  razorpaySignature: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'razorpay_signature',
  },

  // Generic transaction ID (for UPI/bank transfers)
  transactionId: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'transaction_id',
  },

  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at',
  },

  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refund_reason',
  },

  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'refunded_at',
  },
}, {
  tableName: 'payments',
  timestamps: true,
  updatedAt: false,
  underscored: true,
});

module.exports = Payment;
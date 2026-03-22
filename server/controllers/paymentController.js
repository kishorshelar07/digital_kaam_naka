/**
 * ================================================================
 * controllers/paymentController.js — Razorpay Payment Controller
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const { Booking, Payment, Worker } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { notifyPaymentReceived } = require('../config/socket');
const logger = require('../utils/logger');

let razorpay;
try {
  const Razorpay = require('razorpay');
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (e) {
  logger.warn('Razorpay not configured');
}

// ── CREATE RAZORPAY ORDER ─────────────────────────────────────

const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // CHANGED: Booking.findByPk(id, { include: ['payment'] })
    //       → Booking.findById(id).populate('paymentId')
    const booking = await Booking.findById(bookingId).populate('paymentId');
    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.status !== 'completed') return sendError(res, 'Booking must be completed before payment', 400);

    const payment = booking.paymentId;
    if (!payment) return sendError(res, 'Payment record not found', 404);
    if (payment.status === 'completed') return sendError(res, 'Already paid', 400);

    if (!razorpay) return sendError(res, 'Payment gateway not configured. Please pay in cash.', 503);

    const order = await razorpay.orders.create({
      amount: Math.round(payment.amount * 100),
      currency: 'INR',
      receipt: 'booking_' + bookingId,
      notes: { bookingId: String(bookingId) },
    });

    // CHANGED: payment.update({ razorpayOrderId }) → Payment.findByIdAndUpdate()
    await Payment.findByIdAndUpdate(payment._id, { razorpayOrderId: order.id });

    return sendSuccess(res, 'Payment order created', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    logger.error('createPaymentOrder error:', error);
    return sendError(res, 'Failed to create payment order', 500);
  }
};

// ── VERIFY RAZORPAY PAYMENT ───────────────────────────────────

const verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return sendError(res, 'Payment verification failed. Invalid signature.', 400);
    }

    // CHANGED: Payment.findOne({ where: { bookingId } }) → Payment.findOne({ bookingId })
    const payment = await Payment.findOne({ bookingId });
    if (!payment) return sendError(res, 'Payment record not found', 404);

    // CHANGED: payment.update({}) → Payment.findByIdAndUpdate()
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'completed',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      method: 'upi',
      paidAt: new Date(),
    });

    // CHANGED: Worker.increment('totalEarnings') → Worker.findByIdAndUpdate($inc)
    await Worker.findByIdAndUpdate(payment.workerId, {
      $inc: { totalEarnings: payment.workerAmount },
    });

    const worker = await Worker.findById(payment.workerId);
    if (req.app.get('io') && worker) {
      notifyPaymentReceived(req.app.get('io'), worker.userId, {
        amount: payment.workerAmount,
        bookingId,
      });
    }

    return sendSuccess(res, 'Payment confirmed! Worker will be notified.', payment);
  } catch (error) {
    logger.error('verifyPayment error:', error);
    return sendError(res, 'Payment verification failed', 500);
  }
};

// ── CONFIRM CASH PAYMENT ──────────────────────────────────────

const confirmCashPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // CHANGED: Payment.findOne({ where: { bookingId } }) → Payment.findOne({ bookingId })
    const payment = await Payment.findOne({ bookingId });
    if (!payment) return sendError(res, 'Payment not found', 404);
    if (payment.status === 'completed') return sendError(res, 'Already confirmed', 400);

    // CHANGED: payment.update({}) → Payment.findByIdAndUpdate()
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'completed',
      method: 'cash',
      paidAt: new Date(),
    });

    // CHANGED: Worker.increment() → Worker.findByIdAndUpdate($inc)
    await Worker.findByIdAndUpdate(payment.workerId, {
      $inc: { totalEarnings: payment.workerAmount },
    });

    const worker = await Worker.findById(payment.workerId);
    if (req.app.get('io') && worker) {
      notifyPaymentReceived(req.app.get('io'), worker.userId, {
        amount: payment.workerAmount,
        bookingId,
      });
    }

    return sendSuccess(res, 'Cash payment confirmed!', payment);
  } catch (error) {
    logger.error('confirmCashPayment error:', error);
    return sendError(res, 'Failed to confirm payment', 500);
  }
};

module.exports = { createPaymentOrder, verifyPayment, confirmCashPayment };

/**
 * controllers/paymentController.js — Razorpay Payment Controller
 * Author: Digital Kaam Naka Dev Team
 */

const crypto = require('crypto');
const { Booking, Payment, Worker, Employer } = require('../models');
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

/**
 * @desc    Create Razorpay payment order
 * @route   POST /api/payments/create-order
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findByPk(bookingId, { include: ['payment'] });
    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.status !== 'completed') return sendError(res, 'Booking must be completed before payment', 400);

    const payment = booking.payment;
    if (!payment) return sendError(res, 'Payment record not found', 404);
    if (payment.status === 'completed') return sendError(res, 'Already paid', 400);

    if (!razorpay) return sendError(res, 'Payment gateway not configured. Please pay in cash.', 503);

    const order = await razorpay.orders.create({
      amount: Math.round(payment.amount * 100),
      currency: 'INR',
      receipt: 'booking_' + bookingId,
      notes: { bookingId: String(bookingId) },
    });

    await payment.update({ razorpayOrderId: order.id });

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

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/payments/verify
 */
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

    const payment = await Payment.findOne({ where: { bookingId } });
    if (!payment) return sendError(res, 'Payment record not found', 404);

    await payment.update({
      status: 'completed',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      method: 'upi',
      paidAt: new Date(),
    });

    await Worker.increment('totalEarnings', {
      by: payment.workerAmount,
      where: { id: payment.workerId },
    });

    const worker = await Worker.findByPk(payment.workerId);
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

/**
 * @desc    Confirm cash payment
 * @route   POST /api/payments/confirm-cash
 */
const confirmCashPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const payment = await Payment.findOne({ where: { bookingId } });
    if (!payment) return sendError(res, 'Payment not found', 404);
    if (payment.status === 'completed') return sendError(res, 'Already confirmed', 400);

    await payment.update({ status: 'completed', method: 'cash', paidAt: new Date() });

    await Worker.increment('totalEarnings', {
      by: payment.workerAmount,
      where: { id: payment.workerId },
    });

    const worker = await Worker.findByPk(payment.workerId);
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

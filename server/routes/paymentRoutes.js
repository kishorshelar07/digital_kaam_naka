/**
 * routes/paymentRoutes.js
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment, confirmCashPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { Payment, Worker, Employer } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');

router.post('/create-order', protect, authorize('employer'), createPaymentOrder);
router.post('/verify',       protect, authorize('employer'), verifyPayment);
router.post('/confirm-cash', protect, authorize('employer'), confirmCashPayment);

router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = {};
    if (req.user.role === 'worker') {
      // CHANGED: Worker.findOne({ where: { userId: req.user.id } }) → Worker.findOne({ userId })
      const worker = await Worker.findOne({ userId: req.user._id });
      if (worker) filter.workerId = worker._id;
    } else {
      // CHANGED: Employer.findOne({ where: { userId: req.user.id } }) → Employer.findOne({ userId })
      const employer = await Employer.findOne({ userId: req.user._id });
      if (employer) filter.employerId = employer._id;
    }

    // CHANGED: Payment.findAndCountAll() → Payment.find() + countDocuments()
    const [rows, count] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        // CHANGED: include: ['booking'] → .populate('bookingId')
        .populate('bookingId')
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return sendPaginated(res, 'Payment history', rows, count, pageNum, limitNum);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

module.exports = router;

/**
 * routes/paymentRoutes.js
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
    let where = {};
    if (req.user.role === 'worker') {
      const worker = await Worker.findOne({ where: { userId: req.user.id } });
      if (worker) where.workerId = worker.id;
    } else {
      const employer = await Employer.findOne({ where: { userId: req.user.id } });
      if (employer) where.employerId = employer.id;
    }
    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: ['booking'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
    });
    return sendPaginated(res, 'Payment history', rows, count, page, limit);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

module.exports = router;

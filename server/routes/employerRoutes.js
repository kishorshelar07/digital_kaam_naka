/**
 * routes/employerRoutes.js
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const { Employer, User, Booking } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/:id', async (req, res) => {
  try {
    // CHANGED: Employer.findByPk(id, { include: [User] }) → Employer.findById().populate()
    const employer = await Employer.findById(req.params.id)
      .populate({ path: 'userId', select: 'name profilePhoto isVerified createdAt' });
    if (!employer) return sendError(res, 'Employer not found', 404);
    return sendSuccess(res, 'Employer profile fetched', employer);
  } catch (e) {
    return sendError(res, 'Failed to fetch employer', 500);
  }
});

router.put('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    // CHANGED: Employer.findByPk() → Employer.findById()
    const employer = await Employer.findById(req.params.id);
    if (!employer) return sendError(res, 'Not found', 404);

    // CHANGED: employer.userId !== req.user.id → .toString() comparison
    if (employer.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }

    const allowed = ['companyName', 'employerType', 'gstNumber', 'address', 'city', 'district', 'pincode', 'latitude', 'longitude'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) employer[f] = req.body[f]; });

    // CHANGED: employer.update({}) → employer.save()
    await employer.save();
    return sendSuccess(res, 'Employer profile updated', employer);
  } catch (e) {
    return sendError(res, 'Update failed', 500);
  }
});

router.get('/:id/bookings', protect, async (req, res) => {
  try {
    // CHANGED: Employer.findByPk() → Employer.findById()
    const employer = await Employer.findById(req.params.id);
    if (!employer) return sendError(res, 'Not found', 404);

    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { employerId: employer._id };
    if (status) filter.status = status;

    // CHANGED: Booking.findAndCountAll() → Booking.find() + countDocuments()
    const [rows, count] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        // CHANGED: include: ['worker','jobPost','payment'] → .populate()
        .populate({ path: 'workerId', populate: { path: 'userId', select: 'name profilePhoto' } })
        .populate({ path: 'jobPostId', populate: { path: 'categoryId', model: 'Category' } })
        .populate('paymentId')
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return sendPaginated(res, 'Bookings fetched', rows, count, pageNum, limitNum);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

module.exports = router;

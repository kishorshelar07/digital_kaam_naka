/**
 * routes/employerRoutes.js
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
    const employer = await Employer.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['name', 'profilePhoto', 'isVerified', 'createdAt'] }],
    });
    if (!employer) return sendError(res, 'Employer not found', 404);
    return sendSuccess(res, 'Employer profile fetched', employer);
  } catch (e) {
    return sendError(res, 'Failed to fetch employer', 500);
  }
});

router.put('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const employer = await Employer.findByPk(req.params.id);
    if (!employer) return sendError(res, 'Not found', 404);
    if (employer.userId !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }
    const allowed = ['companyName', 'employerType', 'gstNumber', 'address', 'city', 'district', 'pincode', 'latitude', 'longitude'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    await employer.update(updates);
    return sendSuccess(res, 'Employer profile updated', employer);
  } catch (e) {
    return sendError(res, 'Update failed', 500);
  }
});

router.get('/:id/bookings', protect, async (req, res) => {
  try {
    const employer = await Employer.findByPk(req.params.id);
    if (!employer) return sendError(res, 'Not found', 404);
    const { page = 1, limit = 10, status } = req.query;
    const where = { employerId: employer.id };
    if (status) where.status = status;
    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: ['worker', 'jobPost', 'payment'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return sendPaginated(res, 'Bookings fetched', rows, count, page, limit);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

module.exports = router;

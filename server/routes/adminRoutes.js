/**
 * routes/adminRoutes.js
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { User, Worker, Employer, Booking, Payment } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalWorkers, totalEmployers, totalBookings, completedBookings] = await Promise.all([
      User.count(),
      Worker.count(),
      Employer.count(),
      Booking.count(),
      Booking.count({ where: { status: 'completed' } }),
    ]);

    const revenueResult = await Payment.findOne({
      where: { status: 'completed' },
      attributes: [[sequelize.fn('SUM', sequelize.col('platform_fee')), 'total']],
      raw: true,
    });

    return sendSuccess(res, 'Admin dashboard', {
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalBookings,
      completedBookings,
      platformRevenue: parseFloat(revenueResult?.total || 0),
    });
  } catch (e) {
    return sendError(res, 'Failed', 500, e.message);
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role, isVerified, page = 1, limit = 20, q } = req.query;
    const where = {};
    if (role) where.role = role;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (q) {
      where[Op.or] = [
        { name:  { [Op.iLike]: '%' + q + '%' } },
        { phone: { [Op.like]:  '%' + q + '%' } },
      ];
    }
    const users = await User.findAll({
      where,
      include: [{ model: Worker, as: 'workerProfile', required: false }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
    });
    return sendSuccess(res, 'Users fetched', users);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    await user.update({ isVerified: true });
    if (user.role === 'worker') {
      await Worker.update({ isVerified: true }, { where: { userId: user.id } });
    }
    return sendSuccess(res, 'User verified successfully');
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    await user.update({ isActive: !user.isActive });
    return sendSuccess(res, user.isActive ? 'User unblocked' : 'User blocked');
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = status ? { status } : {};
    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: ['worker', 'employer'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
    });
    return sendSuccess(res, 'Bookings fetched', rows, 200, count);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

module.exports = router;

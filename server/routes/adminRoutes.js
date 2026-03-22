/**
 * routes/adminRoutes.js
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 */

const express = require('express');
const router = express.Router();
const { User, Worker, Employer, Booking, Payment } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));

// ── DASHBOARD ────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    // CHANGED: Model.count() → Model.countDocuments()
    const [totalUsers, totalWorkers, totalEmployers, totalBookings, completedBookings] = await Promise.all([
      User.countDocuments(),
      Worker.countDocuments(),
      Employer.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
    ]);

    // CHANGED: sequelize.fn('SUM') → Payment.aggregate($sum)
    const [revenueResult] = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]);

    return sendSuccess(res, 'Admin dashboard', {
      totalUsers, totalWorkers, totalEmployers,
      totalBookings, completedBookings,
      platformRevenue: revenueResult?.total || 0,
    });
  } catch (e) {
    return sendError(res, 'Failed', 500, e.message);
  }
});

// ── LIST USERS ────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { role, isVerified, page = 1, limit = 20, q } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = {};
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    // CHANGED: Op.iLike → $regex with 'i' flag
    if (q) {
      filter.$or = [
        { name:  { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const userIds = users.map((u) => u._id);
    const workerProfiles = await Worker.find({ userId: { $in: userIds } }).lean();
    const workerMap = {};
    workerProfiles.forEach((w) => { workerMap[w.userId.toString()] = w; });

    const result = users.map((u) => ({ ...u, workerProfile: workerMap[u._id.toString()] || null }));
    return sendSuccess(res, 'Users fetched', result);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

// ── VERIFY USER ───────────────────────────────────────────────
router.put('/users/:id/verify', async (req, res) => {
  try {
    // CHANGED: findByPk → findById, update → findByIdAndUpdate
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    await User.findByIdAndUpdate(user._id, { isVerified: true });
    if (user.role === 'worker') {
      await Worker.findOneAndUpdate({ userId: user._id }, { isVerified: true });
    }
    return sendSuccess(res, 'User verified successfully');
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

// ── BLOCK / UNBLOCK USER ──────────────────────────────────────
router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    const newStatus = !user.isActive;
    await User.findByIdAndUpdate(user._id, { isActive: newStatus });
    return sendSuccess(res, newStatus ? 'User unblocked' : 'User blocked');
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

// ── LIST ALL BOOKINGS ─────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const filter = status ? { status } : {};

    // CHANGED: findAndCountAll → find + countDocuments
    const [rows, count] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .populate({ path: 'workerId', populate: { path: 'userId', select: 'name profilePhoto' } })
        .populate({ path: 'employerId', populate: { path: 'userId', select: 'name profilePhoto' } })
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return sendSuccess(res, 'Bookings fetched', rows, 200, count);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

module.exports = router;

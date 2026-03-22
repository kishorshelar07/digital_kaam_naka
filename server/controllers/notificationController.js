/**
 * ================================================================
 * controllers/notificationController.js — Notification Controller
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 *
 * KEY CHANGES:
 *  - Notification.findAndCountAll({ where })
 *    → Notification.find(filter) + Notification.countDocuments(filter)
 *  - Notification.update({}, { where }) → Notification.updateMany({})
 *  - req.user.id → req.user._id
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { Notification } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// ── GET ALL NOTIFICATIONS ─────────────────────────────────────

const getNotifications = async (req, res) => {
  try {
    const { type, isRead, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // CHANGED: { userId: req.user.id } → { userId: req.user._id }
    const filter = { userId: req.user._id };
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    // CHANGED: Notification.findAndCountAll({ where, order, limit, offset })
    //       → Notification.find(filter) + Notification.countDocuments(filter)
    const [rows, count] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return sendPaginated(res, 'Notifications fetched', rows, count, pageNum, limitNum);
  } catch (error) {
    logger.error('getNotifications error:', error);
    return sendError(res, 'Failed to fetch notifications', 500);
  }
};

// ── MARK ALL AS READ ──────────────────────────────────────────

const markAllRead = async (req, res) => {
  try {
    // CHANGED: Notification.update({}, { where: { userId, isRead: false } })
    //       → Notification.updateMany({})
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, 'All notifications marked as read');
  } catch (error) {
    logger.error('markAllRead error:', error);
    return sendError(res, 'Failed to mark notifications as read', 500);
  }
};

// ── MARK ONE AS READ ──────────────────────────────────────────

const markOneRead = async (req, res) => {
  try {
    // CHANGED: Notification.update({}, { where: { id, userId } })
    //       → Notification.findOneAndUpdate({ _id, userId })
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, 'Notification marked as read');
  } catch (error) {
    logger.error('markOneRead error:', error);
    return sendError(res, 'Failed to mark notification as read', 500);
  }
};

module.exports = { getNotifications, markAllRead, markOneRead };

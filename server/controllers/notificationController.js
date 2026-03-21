/**
 * controllers/notificationController.js — Notification Controller
 * Author: Digital Kaam Naka Dev Team
 */

const { Notification } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { type, isRead, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };
    if (type)    where.type   = type;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return sendPaginated(res, 'Notifications fetched', rows, count, page, limit);
  } catch (error) {
    logger.error('getNotifications error:', error);
    return sendError(res, 'Failed to fetch notifications', 500);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 */
const markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } }
    );
    return sendSuccess(res, 'All notifications marked as read');
  } catch (error) {
    logger.error('markAllRead error:', error);
    return sendError(res, 'Failed to mark notifications as read', 500);
  }
};

/**
 * @desc    Mark one notification as read
 * @route   PUT /api/notifications/:id/read
 */
const markOneRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id: req.params.id, userId: req.user.id } }
    );
    return sendSuccess(res, 'Notification marked as read');
  } catch (error) {
    logger.error('markOneRead error:', error);
    return sendError(res, 'Failed to mark notification as read', 500);
  }
};

module.exports = { getNotifications, markAllRead, markOneRead };

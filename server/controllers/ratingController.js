/**
 * controllers/ratingController.js — Rating Controller
 * Author: Digital Kaam Naka Dev Team
 */

const { sequelize } = require('../config/db');
const { Rating, Booking, Worker, Employer } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @desc    Submit a rating after booking completion
 * @route   POST /api/ratings
 */
const submitRating = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { bookingId, score, review } = req.body;

    const booking = await Booking.findByPk(bookingId, {
      include: ['worker', 'employer'],
      transaction: t,
    });
    if (!booking) { await t.rollback(); return sendError(res, 'Booking not found', 404); }
    if (booking.status !== 'completed') { await t.rollback(); return sendError(res, 'Can only rate completed bookings', 400); }

    const isWorker   = booking.worker.userId   === req.user.id;
    const isEmployer = booking.employer.userId === req.user.id;
    if (!isWorker && !isEmployer) { await t.rollback(); return sendError(res, 'Not authorized', 403); }

    const ratedToUserId = isEmployer ? booking.worker.userId : booking.employer.userId;
    const roleRatedTo   = isEmployer ? 'worker' : 'employer';

    const existing = await Rating.findOne({
      where: { bookingId, ratedBy: req.user.id },
      transaction: t,
    });
    if (existing) { await t.rollback(); return sendError(res, 'You have already rated this booking', 409); }

    const rating = await Rating.create({
      bookingId,
      ratedBy: req.user.id,
      ratedTo: ratedToUserId,
      roleRatedTo,
      score: parseInt(score),
      review: review || '',
    }, { transaction: t });

    // Recalculate average rating
    const avgResult = await Rating.findOne({
      where: { ratedTo: ratedToUserId, roleRatedTo, isVisible: true },
      attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avg']],
      raw: true,
      transaction: t,
    });

    const newAvg = parseFloat(parseFloat(avgResult?.avg || 0).toFixed(2));

    if (roleRatedTo === 'worker') {
      await Worker.update({ avgRating: newAvg }, { where: { userId: ratedToUserId }, transaction: t });
      await booking.update({ ratingGivenToWorker: true }, { transaction: t });
    } else {
      await Employer.update({ avgRating: newAvg }, { where: { userId: ratedToUserId }, transaction: t });
      await booking.update({ ratingGivenToEmployer: true }, { transaction: t });
    }

    await t.commit();
    return sendSuccess(res, 'Rating submitted! Thank you. ⭐', rating, 201);
  } catch (error) {
    await t.rollback();
    logger.error('submitRating error:', error);
    return sendError(res, 'Failed to submit rating', 500);
  }
};

module.exports = { submitRating };

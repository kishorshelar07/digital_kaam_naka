/**
 * ================================================================
 * controllers/ratingController.js — Rating Controller
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 *
 * KEY CHANGES:
 *  - sequelize.transaction()         → mongoose.startSession()
 *  - Booking.findByPk()              → Booking.findById()
 *  - Rating.findOne({ where: {} })   → Rating.findOne({})
 *  - Rating.create({}, {transaction})→ Rating.create([{}], { session })
 *  - sequelize.fn('AVG', ...)        → Rating.aggregate($avg)
 *  - Worker.update({}, { where: {}}) → Worker.findOneAndUpdate()
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { Rating, Booking, Worker, Employer } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

const submitRating = async (req, res) => {
  try {
    const { bookingId, score, review } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('workerId')
      .populate('employerId');

    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.status !== 'completed') return sendError(res, 'Can only rate completed bookings', 400);

    const isWorker   = booking.workerId.userId.toString()   === req.user._id.toString();
    const isEmployer = booking.employerId.userId.toString() === req.user._id.toString();
    if (!isWorker && !isEmployer) return sendError(res, 'Not authorized', 403);

    const ratedToUserId = isEmployer ? booking.workerId.userId : booking.employerId.userId;
    const roleRatedTo   = isEmployer ? 'worker' : 'employer';

    const existing = await Rating.findOne({ bookingId, ratedBy: req.user._id });
    if (existing) return sendError(res, 'You have already rated this booking', 409);

    const rating = await Rating.create({
      bookingId,
      ratedBy: req.user._id,
      ratedTo: ratedToUserId,
      roleRatedTo,
      score: parseInt(score),
      review: review || '',
    });

    // Recalculate average rating
    const [avgResult] = await Rating.aggregate([
      { $match: { ratedTo: ratedToUserId, roleRatedTo, isVisible: true } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]);

    const newAvg = parseFloat((avgResult?.avg || 0).toFixed(2));

    if (roleRatedTo === 'worker') {
      await Worker.findOneAndUpdate({ userId: ratedToUserId }, { avgRating: newAvg });
      await Booking.findByIdAndUpdate(bookingId, { ratingGivenToWorker: true });
    } else {
      await Employer.findOneAndUpdate({ userId: ratedToUserId }, { avgRating: newAvg });
      await Booking.findByIdAndUpdate(bookingId, { ratingGivenToEmployer: true });
    }

    return sendSuccess(res, 'Rating submitted! Thank you. ⭐', rating, 201);
  } catch (error) {
    logger.error('submitRating error:', error);
    return sendError(res, 'Failed to submit rating', 500);
  }
};

module.exports = { submitRating };
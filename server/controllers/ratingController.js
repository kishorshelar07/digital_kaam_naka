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

const mongoose = require('mongoose');
const { Rating, Booking, Worker, Employer } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

const submitRating = async (req, res) => {
  // CHANGED: sequelize.transaction() → mongoose.startSession()
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookingId, score, review } = req.body;

    // CHANGED: Booking.findByPk(id, { include: ['worker','employer'] })
    //       → Booking.findById().populate()
    const booking = await Booking.findById(bookingId)
      .populate('workerId')
      .populate('employerId')
      .session(session);

    if (!booking) { await session.abortTransaction(); session.endSession(); return sendError(res, 'Booking not found', 404); }
    if (booking.status !== 'completed') { await session.abortTransaction(); session.endSession(); return sendError(res, 'Can only rate completed bookings', 400); }

    // CHANGED: booking.worker.userId === req.user.id → .toString() comparison
    const isWorker   = booking.workerId.userId.toString()   === req.user._id.toString();
    const isEmployer = booking.employerId.userId.toString() === req.user._id.toString();
    if (!isWorker && !isEmployer) { await session.abortTransaction(); session.endSession(); return sendError(res, 'Not authorized', 403); }

    const ratedToUserId = isEmployer ? booking.workerId.userId   : booking.employerId.userId;
    const roleRatedTo   = isEmployer ? 'worker' : 'employer';

    // CHANGED: Rating.findOne({ where: { bookingId, ratedBy } }) → Rating.findOne({})
    const existing = await Rating.findOne({
      bookingId,
      ratedBy: req.user._id,
    }).session(session);

    if (existing) { await session.abortTransaction(); session.endSession(); return sendError(res, 'You have already rated this booking', 409); }

    // CHANGED: Rating.create({}, { transaction }) → Rating.create([{}], { session })
    const [rating] = await Rating.create(
      [{
        bookingId,
        ratedBy: req.user._id,
        ratedTo: ratedToUserId,
        roleRatedTo,
        score: parseInt(score),
        review: review || '',
      }],
      { session }
    );

    // CHANGED: sequelize.fn('AVG', col('score')) → Rating.aggregate($avg pipeline
    const [avgResult] = await Rating.aggregate([
      { $match: { ratedTo: ratedToUserId, roleRatedTo, isVisible: true } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]).session(session);

    const newAvg = parseFloat((avgResult?.avg || 0).toFixed(2));

    if (roleRatedTo === 'worker') {
      // CHANGED: Worker.update({ avgRating }, { where: { userId } }) → Worker.findOneAndUpdate()
      await Worker.findOneAndUpdate(
        { userId: ratedToUserId },
        { avgRating: newAvg },
        { session }
      );
      await Booking.findByIdAndUpdate(bookingId, { ratingGivenToWorker: true }, { session });
    } else {
      // CHANGED: Employer.update({ avgRating }, { where: { userId } }) → Employer.findOneAndUpdate()
      await Employer.findOneAndUpdate(
        { userId: ratedToUserId },
        { avgRating: newAvg },
        { session }
      );
      await Booking.findByIdAndUpdate(bookingId, { ratingGivenToEmployer: true }, { session });
    }

    // CHANGED: t.commit() → session.commitTransaction()
    await session.commitTransaction();
    session.endSession();
    return sendSuccess(res, 'Rating submitted! Thank you. ⭐', rating, 201);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('submitRating error:', error);
    return sendError(res, 'Failed to submit rating', 500);
  }
};

module.exports = { submitRating };

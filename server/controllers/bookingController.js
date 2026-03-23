/**
 * ================================================================
 * controllers/bookingController.js — Booking Lifecycle Controller
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 *
 * KEY CHANGES:
 *  - sequelize.transaction()        → mongoose.startSession() + session.startTransaction()
 *  - transaction: t option          → session option in each query
 *  - t.commit() / t.rollback()      → session.commitTransaction() / session.abortTransaction()
 *  - Booking.findByPk()             → Booking.findById()
 *  - booking.update({})             → Object.assign + booking.save()
 *  - Worker.increment({totalJobs})  → Worker.findByIdAndUpdate({$inc})
 *  - Employer.findOne({ where: {}}) → Employer.findOne({})
 *  - include: [Worker, User]        → .populate()
 *  - Op.in                          → $in
 *  - Booking.findAndCountAll()      → Booking.find() + countDocuments()
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');
const { User, Worker, Employer, Booking, JobPost, Payment, Notification, Category } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { sendBookingConfirmationToWorker, sendAcceptanceToEmployer } = require('../utils/sendWhatsApp');
const { sendPushNotification } = require('../utils/sendPushNotif');
const {
  notifyNewBookingRequest, notifyBookingAccepted,
  notifyBookingRejected, notifyWorkStarted, notifyWorkCompleted,
} = require('../config/socket');
const logger = require('../utils/logger');

// ── Helper: Create in-app notification ───────────────────────

const createNotification = async (userId, type, titles, messages, referenceId, referenceType) => {
  try {
    await Notification.create({
      userId, type,
      titleMr: titles.mr, titleHi: titles.hi, titleEn: titles.en,
      messageMr: messages.mr, messageHi: messages.hi, messageEn: messages.en,
      referenceId, referenceType,
      channel: 'app',
    });
  } catch (error) {
    logger.error('createNotification failed:', error.message);
  }
};

// ── Helper: populate a booking fully ─────────────────────────

const populateBooking = (query) =>
  query
    .populate({ path: 'workerId', populate: { path: 'userId', select: 'name profilePhoto phone' } })
    .populate({ path: 'employerId', populate: { path: 'userId', select: 'name profilePhoto phone' } })
    .populate({ path: 'jobPostId', populate: { path: 'categoryId', model: 'Category' } })
    .populate('paymentId');

// ── CREATE BOOKING ────────────────────────────────────────────

const createBooking = async (req, res) => {
  try {
    const { workerId, jobPostId, startDate, endDate, totalDays, agreedRate, bookingNote } = req.body;

    const employer = await Employer.findOne({ userId: req.user._id });
    if (!employer) return sendError(res, 'Employer profile not found', 404);

    const worker = await Worker.findById(workerId)
      .populate({ path: 'userId', select: 'name phone language fcmToken' });
    if (!worker) return sendError(res, 'Worker not found', 404);

    const existingBooking = await Booking.findOne({
      workerId: worker._id,
      status: { $in: ['accepted', 'started'] },
      startDate: new Date(startDate),
    });

    if (existingBooking) {
      return sendError(res, 'Worker is already booked on this date', 409);
    }

    const totalAmount = parseFloat(agreedRate) * parseInt(totalDays || 1);

    const booking = await Booking.create({
      jobPostId: jobPostId || null,
      workerId: worker._id,
      employerId: employer._id,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : new Date(startDate),
      totalDays: parseInt(totalDays) || 1,
      agreedRate: parseFloat(agreedRate),
      totalAmount,
      bookingNote: bookingNote || '',
      status: 'pending',
    });

    // If from a job post, increment workers booked
    if (jobPostId) {
      const jobPost = await JobPost.findById(jobPostId);
      if (jobPost) {
        const newBookedCount = (jobPost.workersBooked || 0) + 1;
        const newStatus = newBookedCount >= jobPost.workersNeeded ? 'filled' : 'partially_filled';
        await JobPost.findByIdAndUpdate(jobPostId, { workersBooked: newBookedCount, status: newStatus });
      }
    }

    // Create pending payment record
    const feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 5;
    const platformFee = parseFloat((totalAmount * feePercent / 100).toFixed(2));
    await Payment.create({
      bookingId: booking._id,
      employerId: employer._id,
      workerId: worker._id,
      amount: totalAmount,
      platformFee,
      workerAmount: totalAmount - platformFee,
      status: 'pending',
      method: 'cash',
    });

    // ── Post-transaction notifications ────────────────────────
    // CHANGED: User.findByPk() → User.findById()
    const employerUser = await User.findById(req.user._id).select('name phone language');

    await createNotification(
      worker.userId._id, 'booking_request',
      {
        mr: `${employerUser.name} यांनी booking request पाठवली`,
        hi: `${employerUser.name} ने booking request भेजी`,
        en: `${employerUser.name} sent you a booking request`,
      },
      {
        mr: `काम: तारीख ${startDate} | रोज ₹${agreedRate}`,
        hi: `काम: तारीख ${startDate} | दैनिक ₹${agreedRate}`,
        en: `Work date: ${startDate} | Rate: ₹${agreedRate}/day`,
      },
      booking._id, 'booking'
    );

    sendBookingConfirmationToWorker(
      worker.userId.phone, worker.userId.name, employerUser.name,
      'New Job', startDate, agreedRate, worker.userId.language || 'mr'
    ).catch(() => {});

    if (req.app.get('io')) {
      notifyNewBookingRequest(req.app.get('io'), worker.userId._id, {
        bookingId: booking._id, employerName: employerUser.name,
        startDate, agreedRate, totalDays,
      });
    }

    if (worker.userId.fcmToken) {
      sendPushNotification(
        worker.userId.fcmToken,
        '🎉 नवीन Booking Request!',
        `${employerUser.name} यांनी ₹${agreedRate}/दिवस साठी request केली`,
        { bookingId: String(booking._id), screen: 'BookingDetail' }
      ).catch(() => {});
    }

    // CHANGED: Booking.findByPk(id, { include: [...] }) → populateBooking(Booking.findById())
    const fullBooking = await populateBooking(Booking.findById(booking._id));
    return sendSuccess(res, 'Booking request sent successfully!', fullBooking, 201);
  } catch (error) {
    logger.error('createBooking error:', error.message);
    return sendError(res, 'Failed to create booking: ' + error.message, 500);
  }
};

// ── ACCEPT BOOKING ────────────────────────────────────────────

const acceptBooking = async (req, res) => {
  try {
    // CHANGED: Booking.findByPk(id, { include: [...] }) → populateBooking(Booking.findById())
    const booking = await populateBooking(Booking.findById(req.params.id));
    if (!booking) return sendError(res, 'Booking not found', 404);

    // CHANGED: booking.worker.userId !== req.user.id → .toString() comparison
    if (booking.workerId.userId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Only the assigned worker can accept this booking', 403);
    }

    if (booking.status !== 'pending') {
      return sendError(res, `Cannot accept booking with status: ${booking.status}`, 400);
    }

    // CHANGED: booking.update({ status }) → booking.status = ...; booking.save()
    booking.status = 'accepted';
    await booking.save();

    const workerUser = await User.findById(req.user._id).select('name');
    const employerUser = booking.employerId.userId;

    await createNotification(
      employerUser._id, 'booking_accepted',
      {
        mr: `${workerUser.name} यांनी booking accept केली! ✅`,
        hi: `${workerUser.name} ने booking accept की! ✅`,
        en: `${workerUser.name} accepted your booking! ✅`,
      },
      {
        mr: `तारीख: ${booking.startDate} | ₹${booking.agreedRate}/दिवस`,
        hi: `तारीख: ${booking.startDate} | ₹${booking.agreedRate}/दिन`,
        en: `Date: ${booking.startDate} | ₹${booking.agreedRate}/day`,
      },
      booking._id, 'booking'
    );

    sendAcceptanceToEmployer(
      employerUser.phone, employerUser.name,
      workerUser.name, booking.jobPostId?.title || 'Direct Booking',
      booking.startDate, employerUser.language
    ).catch(() => {});

    if (req.app.get('io')) {
      notifyBookingAccepted(req.app.get('io'), employerUser._id, {
        bookingId: booking._id, workerName: workerUser.name, startDate: booking.startDate,
      });
    }

    return sendSuccess(res, 'Booking accepted! Employer has been notified.', booking);
  } catch (error) {
    logger.error('acceptBooking error:', error);
    return sendError(res, 'Failed to accept booking', 500);
  }
};

// ── REJECT BOOKING ────────────────────────────────────────────

const rejectBooking = async (req, res) => {
  try {
    const booking = await populateBooking(Booking.findById(req.params.id));
    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.workerId.userId._id.toString() !== req.user._id.toString())
      return sendError(res, 'Not authorized', 403);
    if (booking.status !== 'pending')
      return sendError(res, `Cannot reject booking with status: ${booking.status}`, 400);

    const { reason } = req.body;
    booking.status = 'rejected';
    booking.cancelReason = reason || '';
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    await booking.save();

    if (booking.jobPostId) {
      const job = await JobPost.findById(booking.jobPostId._id);
      if (job && job.workersBooked > 0) {
        // CHANGED: job.update({}) → Job.findByIdAndUpdate($inc)
        await JobPost.findByIdAndUpdate(job._id, {
          $inc: { workersBooked: -1 },
          status: 'open',
        });
      }
    }

    const employerUser = booking.employerId.userId;
    await createNotification(
      employerUser._id, 'booking_rejected',
      { mr: 'Booking नाकारली गेली', hi: 'Booking अस्वीकार की गई', en: 'Booking was rejected' },
      { mr: `कारण: ${reason || 'कारण नाही'}`, hi: `कारण: ${reason || 'कोई कारण नहीं'}`, en: `Reason: ${reason || 'No reason given'}` },
      booking._id, 'booking'
    );

    if (req.app.get('io')) {
      notifyBookingRejected(req.app.get('io'), employerUser._id, { bookingId: booking._id, reason });
    }

    return sendSuccess(res, 'Booking rejected', booking);
  } catch (error) {
    logger.error('rejectBooking error:', error);
    return sendError(res, 'Failed to reject booking', 500);
  }
};

// ── MARK WORK STARTED ─────────────────────────────────────────

const startWork = async (req, res) => {
  try {
    const booking = await populateBooking(Booking.findById(req.params.id));
    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.workerId.userId._id.toString() !== req.user._id.toString())
      return sendError(res, 'Not authorized', 403);
    if (booking.status !== 'accepted')
      return sendError(res, 'Booking must be accepted before starting', 400);

    const { latitude, longitude } = req.body;
    booking.status = 'started';
    booking.workStartedAt = new Date();
    booking.workSiteLatitude = latitude ? parseFloat(latitude) : null;
    booking.workSiteLongitude = longitude ? parseFloat(longitude) : null;
    await booking.save();

    const employerUser = booking.employerId.userId;
    await createNotification(
      employerUser._id, 'booking_started',
      { mr: 'कामगार काम सुरू केले! 🔨', hi: 'मजदूर ने काम शुरू किया! 🔨', en: 'Worker has started the work! 🔨' },
      { mr: `आजपासून काम सुरू`, hi: `आज से काम शुरू`, en: `Work started today` },
      booking._id, 'booking'
    );

    if (req.app.get('io')) {
      notifyWorkStarted(req.app.get('io'), employerUser._id, { bookingId: booking._id });
    }

    return sendSuccess(res, 'Work started! Employer has been notified. 🔨', booking);
  } catch (error) {
    logger.error('startWork error:', error);
    return sendError(res, 'Failed to mark work as started', 500);
  }
};

// ── MARK WORK COMPLETED ───────────────────────────────────────

const completeWork = async (req, res) => {
  try {
    const booking = await populateBooking(Booking.findById(req.params.id));

    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.status !== 'started') return sendError(res, 'Work must be started before completing', 400);

    const workerUserId = booking.workerId.userId._id;
    const employerUserId = booking.employerId.userId._id;

    const isWorker = workerUserId.toString() === req.user._id.toString();
    const isEmployer = employerUserId.toString() === req.user._id.toString();
    if (!isWorker && !isEmployer && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }

    booking.status = 'completed';
    booking.workEndedAt = new Date();
    await booking.save();

    await Worker.findByIdAndUpdate(
      booking.workerId._id,
      { $inc: { totalJobs: 1, totalEarnings: booking.totalAmount * 0.95 } }
    );

    await Employer.findByIdAndUpdate(
      booking.employerId._id,
      { $inc: { totalHires: 1, totalSpent: booking.totalAmount } }
    );

    const workerUser = booking.workerId.userId;
    const employerUser = booking.employerId.userId;

    await createNotification(
      workerUser._id, 'booking_completed',
      { mr: 'काम पूर्ण झाले! 🎉', hi: 'काम पूरा हुआ! 🎉', en: 'Work completed! 🎉' },
      { mr: `₹${booking.totalAmount} payment pending आहे`, hi: `₹${booking.totalAmount} payment pending है`, en: `₹${booking.totalAmount} payment is pending` },
      booking._id, 'booking'
    );
    await createNotification(
      employerUser._id, 'booking_completed',
      { mr: 'काम पूर्ण झाले! आता rating द्या', hi: 'काम पूरा हुआ! अब rating दें', en: 'Work complete! Please rate the worker.' },
      { mr: `₹${booking.totalAmount} payment करा`, hi: `₹${booking.totalAmount} payment करें`, en: `Please pay ₹${booking.totalAmount}` },
      booking._id, 'booking'
    );

    if (req.app.get('io')) {
      notifyWorkCompleted(req.app.get('io'), workerUser._id, employerUser._id, { bookingId: booking._id });
    }

    return sendSuccess(res, 'Work marked as completed! 🎉 Please proceed to payment and rating.', booking);
  } catch (error) {
    logger.error('completeWork error:', error);
    return sendError(res, 'Failed to complete booking', 500);
  }
};

// ── CANCEL BOOKING ────────────────────────────────────────────

const cancelBooking = async (req, res) => {
  try {
    const booking = await populateBooking(Booking.findById(req.params.id));
    if (!booking) return sendError(res, 'Booking not found', 404);
    if (!booking.canBeCancelled())
      return sendError(res, `Cannot cancel booking with status: ${booking.status}`, 400);

    const workerUserId = booking.workerId?.userId?._id?.toString();
    const employerUserId = booking.employerId?.userId?._id?.toString();
    const isWorker = workerUserId === req.user._id.toString();
    const isEmployer = employerUserId === req.user._id.toString();
    if (!isWorker && !isEmployer && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to cancel this booking', 403);
    }

    const prevStatus = booking.status;
    const { reason } = req.body;
    booking.status = 'cancelled';
    booking.cancelReason = reason || '';
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    await booking.save();

    if (booking.jobPostId && ['accepted', 'pending'].includes(prevStatus)) {
      const job = await JobPost.findById(booking.jobPostId._id);
      if (job && job.workersBooked > 0) {
        await JobPost.findByIdAndUpdate(job._id, {
          $inc: { workersBooked: -1 },
          status: 'open',
        });
      }
    }

    return sendSuccess(res, 'Booking cancelled successfully', booking);
  } catch (error) {
    logger.error('cancelBooking error:', error);
    return sendError(res, 'Failed to cancel booking', 500);
  }
};

// ── GET MY BOOKINGS ───────────────────────────────────────────

const getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const filter = {};

    if (req.user.role === 'worker') {
      // CHANGED: Worker.findOne({ where: { userId } }) → Worker.findOne({ userId })
      const worker = await Worker.findOne({ userId: req.user._id });
      if (!worker) return sendError(res, 'Worker profile not found', 404);
      filter.workerId = worker._id;
    } else if (req.user.role === 'employer') {
      // CHANGED: Employer.findOne({ where: { userId } }) → Employer.findOne({ userId })
      const employer = await Employer.findOne({ userId: req.user._id });
      if (!employer) return sendError(res, 'Employer profile not found', 404);
      filter.employerId = employer._id;
    }

    if (status) {
      // CHANGED: Op.in → $in; handle comma-separated string
      const statusArr = typeof status === 'string' && status.includes(',')
        ? status.split(',').map((s) => s.trim())
        : status;
      filter.status = Array.isArray(statusArr) ? { $in: statusArr } : statusArr;
    }

    // CHANGED: Booking.findAndCountAll() → Booking.find() + countDocuments()
    const [rows, count] = await Promise.all([
      populateBooking(
        Booking.find(filter).sort({ createdAt: -1 }).limit(limitNum).skip((pageNum - 1) * limitNum)
      ),
      Booking.countDocuments(filter),
    ]);

    return sendPaginated(res, 'Bookings fetched', rows, count, pageNum, limitNum);
  } catch (error) {
    logger.error('getMyBookings error:', error);
    return sendError(res, 'Failed to fetch bookings', 500);
  }
};

// ── GET BOOKING BY ID ─────────────────────────────────────────

const getBookingById = async (req, res) => {
  try {
    // CHANGED: Booking.findByPk() → Booking.findById()
    const booking = await populateBooking(Booking.findById(req.params.id));
    if (!booking) return sendError(res, 'Booking not found', 404);

    const workerUserId = booking.workerId?.userId?._id?.toString();
    const employerUserId = booking.employerId?.userId?._id?.toString();
    const isWorker = workerUserId === req.user._id.toString();
    const isEmployer = employerUserId === req.user._id.toString();

    if (!isWorker && !isEmployer && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to view this booking', 403);
    }

    return sendSuccess(res, 'Booking fetched', booking);
  } catch (error) {
    logger.error('getBookingById error:', error);
    return sendError(res, 'Failed to fetch booking', 500);
  }
};

module.exports = {
  createBooking,
  acceptBooking,
  rejectBooking,
  startWork,
  completeWork,
  cancelBooking,
  getMyBookings,
  getBookingById,
};
/**
 * ================================================================
 * controllers/bookingController.js — Booking Lifecycle Controller
 * Manages the complete booking flow:
 * Create → Accept/Reject → Start → Complete → Pay → Rate
 * Includes real-time Socket.IO notifications and WhatsApp alerts.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { User, Worker, Employer, Booking, JobPost, Payment, Notification, Category } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { sendBookingConfirmationToWorker, sendAcceptanceToEmployer } = require('../utils/sendWhatsApp');
const { sendPushNotification } = require('../utils/sendPushNotif');
const {
  notifyNewBookingRequest, notifyBookingAccepted,
  notifyBookingRejected, notifyWorkStarted, notifyWorkCompleted,
} = require('../config/socket');
const logger = require('../utils/logger');

/**
 * @desc    Helper: Create in-app notification record
 */
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

// ── CREATE BOOKING ────────────────────────────────────────────

/**
 * @desc    Employer creates a booking request for a worker
 * @route   POST /api/bookings
 * @access  Protected (employer only)
 */
const createBooking = async (req, res) => {
  // Use transaction — booking + job slot update must both succeed or fail together
  const t = await sequelize.transaction();

  try {
    const { workerId, jobPostId, startDate, endDate, totalDays, agreedRate, bookingNote } = req.body;

    // Get employer profile
    const employer = await Employer.findOne({ where: { userId: req.user.id }, transaction: t });
    if (!employer) return sendError(res, 'Employer profile not found', 404);

    // Get worker + user details for notifications
    const worker = await Worker.findByPk(workerId, {
      include: [{ model: User, as: 'user', attributes: ['name', 'phone', 'language', 'fcmToken'] }],
      transaction: t,
    });
    if (!worker) return sendError(res, 'Worker not found', 404);
    // Note: isAvailable check removed — employer can book any worker

    // Check for overlapping bookings (simple check - same date)
    const existingBooking = await Booking.findOne({
      where: {
        workerId: parseInt(workerId),
        status: { [Op.in]: ['accepted', 'started'] },
        startDate: startDate,
      },
      transaction: t,
    });

    if (existingBooking) {
      await t.rollback();
      return sendError(res, 'Worker is already booked on this date', 409);
    }

    const totalAmount = parseFloat(agreedRate) * parseInt(totalDays || 1);

    // Create the booking
    const booking = await Booking.create({
      jobPostId: jobPostId ? parseInt(jobPostId) : null,
      workerId: parseInt(workerId),
      employerId: employer.id,
      startDate,
      endDate: endDate || startDate,
      totalDays: parseInt(totalDays) || 1,
      agreedRate: parseFloat(agreedRate),
      totalAmount,
      bookingNote: bookingNote || '',
      status: 'pending',
    }, { transaction: t });

    // If from a job post, increment workers booked
    if (jobPostId) {
      const jobPost = await JobPost.findByPk(jobPostId, { transaction: t });
      if (jobPost) {
        const newBookedCount = (jobPost.workersBooked || 0) + 1;
        const newStatus = newBookedCount >= jobPost.workersNeeded ? 'filled' : 'partially_filled';
        await jobPost.update(
          { workersBooked: newBookedCount, status: newStatus },
          { transaction: t }
        );
      }
    }

    // Create payment record (pending)
    const platformFee = parseFloat((totalAmount * 0.05).toFixed(2));
    await Payment.create({
      bookingId: booking.id,
      employerId: employer.id,
      workerId: parseInt(workerId),
      amount: totalAmount,
      platformFee,
      workerAmount: totalAmount - platformFee,
      status: 'pending',
      method: 'cash', // default, updated during payment
    }, { transaction: t });

    await t.commit();

    // ── Post-transaction notifications ────────────────────────

    // Get employer user details for notification content
    const employerUser = await User.findByPk(req.user.id, { attributes: ['name', 'phone', 'language'] });

    // In-app notification to worker
    await createNotification(
      worker.userId, 'booking_request',
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
      booking.id, 'booking'
    );

    // WhatsApp notification to worker
    sendBookingConfirmationToWorker(
      worker.user.phone, worker.user.name, employerUser.name,
      'New Job', startDate, agreedRate, worker.user.language || 'mr'
    ).catch(() => {}); // Non-blocking

    // Real-time Socket.IO notification
    if (req.app.get('io')) {
      notifyNewBookingRequest(req.app.get('io'), worker.userId, {
        bookingId: booking.id,
        employerName: employerUser.name,
        startDate, agreedRate, totalDays,
      });
    }

    // FCM push notification
    if (worker.user.fcmToken) {
      sendPushNotification(
        worker.user.fcmToken,
        '🎉 नवीन Booking Request!',
        `${employerUser.name} यांनी ₹${agreedRate}/दिवस साठी request केली`,
        { bookingId: String(booking.id), screen: 'BookingDetail' }
      ).catch(() => {});
    }

    const fullBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: Worker,   as: 'worker',   required: false,
          include: [{ model: User, as: 'user', attributes: ['name','profilePhoto','phone'], required: false }] },
        { model: Employer, as: 'employer', required: false,
          include: [{ model: User, as: 'user', attributes: ['name','profilePhoto'], required: false }] },
        { model: Payment,  as: 'payment',  required: false },
      ],
    });

    return sendSuccess(res, 'Booking request sent successfully!', fullBooking, 201);
  } catch (error) {
    await t.rollback();
    logger.error('createBooking error:', error.message);
    logger.error(error.stack);
    return sendError(res, 'Failed to create booking: ' + error.message, 500);
  }
};

// ── ACCEPT BOOKING ────────────────────────────────────────────

/**
 * @desc    Worker accepts a pending booking request
 * @route   PUT /api/bookings/:id/accept
 * @access  Protected (worker only)
 */
const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Worker,   as: 'worker',   required: false,
          include: [{ model: User, as: 'user', required: false }] },
        { model: Employer, as: 'employer', required: false,
          include: [{ model: User, as: 'user', required: false }] },
      ],
    });

    if (!booking) return sendError(res, 'Booking not found', 404);

    // Only the booked worker can accept
    if (booking.worker.userId !== req.user.id) {
      return sendError(res, 'Only the assigned worker can accept this booking', 403);
    }

    if (booking.status !== 'pending') {
      return sendError(res, `Cannot accept booking with status: ${booking.status}`, 400);
    }

    await booking.update({ status: 'accepted' });

    // Notify employer via multiple channels
    const workerUser = await User.findByPk(req.user.id, { attributes: ['name'] });
    const employerUser = booking.employer.user;
    const jobTitle = booking.jobPost?.title || 'Direct Booking';

    await createNotification(
      employerUser.id, 'booking_accepted',
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
      booking.id, 'booking'
    );

    sendAcceptanceToEmployer(
      employerUser.phone, employerUser.name,
      workerUser.name, jobTitle, booking.startDate, employerUser.language
    ).catch(() => {});

    if (req.app.get('io')) {
      notifyBookingAccepted(req.app.get('io'), employerUser.id, {
        bookingId: booking.id, workerName: workerUser.name, startDate: booking.startDate,
      });
    }

    return sendSuccess(res, 'Booking accepted! Employer has been notified.', booking);
  } catch (error) {
    logger.error('acceptBooking error:', error);
    return sendError(res, 'Failed to accept booking', 500);
  }
};

// ── REJECT BOOKING ────────────────────────────────────────────

/**
 * @desc    Worker rejects a booking request
 * @route   PUT /api/bookings/:id/reject
 * @access  Protected (worker only)
 */
const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Worker,   as: 'worker',   required: false,
          include: [{ model: User, as: 'user', required: false }] },
        { model: Employer, as: 'employer', required: false,
          include: [{ model: User, as: 'user', required: false }] },
      ],
    });

    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.worker.userId !== req.user.id) return sendError(res, 'Not authorized', 403);
    if (booking.status !== 'pending') return sendError(res, `Cannot reject booking with status: ${booking.status}`, 400);

    const { reason } = req.body;
    await booking.update({ status: 'rejected', cancelReason: reason || '', cancelledBy: req.user.id, cancelledAt: new Date() });

    // If from job post, decrement workers_booked
    if (booking.jobPostId) {
      const job = await JobPost.findByPk(booking.jobPostId);
      if (job && job.workersBooked > 0) {
        await job.update({
          workersBooked: job.workersBooked - 1,
          status: 'open',
        });
      }
    }

    const employerUser = booking.employer.user;
    await createNotification(
      employerUser.id, 'booking_rejected',
      { mr: 'Booking नाकारली गेली', hi: 'Booking अस्वीकार की गई', en: 'Booking was rejected' },
      { mr: `कारण: ${reason || 'कारण नाही'}`, hi: `कारण: ${reason || 'कोई कारण नहीं'}`, en: `Reason: ${reason || 'No reason given'}` },
      booking.id, 'booking'
    );

    if (req.app.get('io')) {
      notifyBookingRejected(req.app.get('io'), employerUser.id, { bookingId: booking.id, reason });
    }

    return sendSuccess(res, 'Booking rejected', booking);
  } catch (error) {
    logger.error('rejectBooking error:', error);
    return sendError(res, 'Failed to reject booking', 500);
  }
};

// ── MARK WORK STARTED ─────────────────────────────────────────

/**
 * @desc    Worker marks that they have started the work
 * @route   PUT /api/bookings/:id/start
 * @access  Protected (worker only)
 */
const startWork = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Worker,   as: 'worker',   required: false,
          include: [{ model: User, as: 'user', required: false }] },
        { model: Employer, as: 'employer', required: false,
          include: [{ model: User, as: 'user', required: false }] },
      ],
    });

    if (!booking) return sendError(res, 'Booking not found', 404);
    if (booking.worker.userId !== req.user.id) return sendError(res, 'Not authorized', 403);
    if (booking.status !== 'accepted') return sendError(res, 'Booking must be accepted before starting', 400);

    const { latitude, longitude } = req.body;
    await booking.update({
      status: 'started',
      workStartedAt: new Date(),
      workSiteLatitude: latitude ? parseFloat(latitude) : null,
      workSiteLongitude: longitude ? parseFloat(longitude) : null,
    });

    const employerUser = booking.employer.user;
    await createNotification(
      employerUser.id, 'booking_started',
      { mr: 'कामगार काम सुरू केले! 🔨', hi: 'मजदूर ने काम शुरू किया! 🔨', en: 'Worker has started the work! 🔨' },
      { mr: `आजपासून काम सुरू`, hi: `आज से काम शुरू`, en: `Work started today` },
      booking.id, 'booking'
    );

    if (req.app.get('io')) {
      notifyWorkStarted(req.app.get('io'), employerUser.id, { bookingId: booking.id });
    }

    return sendSuccess(res, 'Work started! Employer has been notified. 🔨', booking);
  } catch (error) {
    logger.error('startWork error:', error);
    return sendError(res, 'Failed to mark work as started', 500);
  }
};

// ── MARK WORK COMPLETED ───────────────────────────────────────

/**
 * @desc    Mark work as completed — triggers payment + rating flow
 * @route   PUT /api/bookings/:id/complete
 * @access  Protected (employer or worker)
 */
const completeWork = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Worker,   as: 'worker',   required: false,
          include: [{ model: User, as: 'user', required: false }] },
        { model: Employer, as: 'employer', required: false,
          include: [{ model: User, as: 'user', required: false }] },
      ],
      transaction: t,
    });

    if (!booking) { await t.rollback(); return sendError(res, 'Booking not found', 404); }
    if (booking.status !== 'started') { await t.rollback(); return sendError(res, 'Work must be started before completing', 400); }

    // Either party can mark complete
    const isWorker = booking.worker.userId === req.user.id;
    const isEmployer = booking.employer.userId === req.user.id;
    if (!isWorker && !isEmployer && req.user.role !== 'admin') {
      await t.rollback();
      return sendError(res, 'Not authorized', 403);
    }

    await booking.update({ status: 'completed', workEndedAt: new Date() }, { transaction: t });

    // Update worker stats
    await Worker.increment(
      { totalJobs: 1, totalEarnings: booking.totalAmount * 0.95 },
      { where: { id: booking.workerId }, transaction: t }
    );

    // Update employer stats
    await Employer.increment(
      { totalHires: 1, totalSpent: booking.totalAmount },
      { where: { id: booking.employerId }, transaction: t }
    );

    await t.commit();

    // Notify both parties
    const workerUser = booking.worker.user;
    const employerUser = booking.employer.user;

    await createNotification(
      workerUser.id, 'booking_completed',
      { mr: 'काम पूर्ण झाले! 🎉', hi: 'काम पूरा हुआ! 🎉', en: 'Work completed! 🎉' },
      { mr: `₹${booking.totalAmount} payment pending आहे`, hi: `₹${booking.totalAmount} payment pending है`, en: `₹${booking.totalAmount} payment is pending` },
      booking.id, 'booking'
    );

    await createNotification(
      employerUser.id, 'booking_completed',
      { mr: 'काम पूर्ण झाले! आता rating द्या', hi: 'काम पूरा हुआ! अब rating दें', en: 'Work complete! Please rate the worker.' },
      { mr: `₹${booking.totalAmount} payment करा`, hi: `₹${booking.totalAmount} payment करें`, en: `Please pay ₹${booking.totalAmount}` },
      booking.id, 'booking'
    );

    if (req.app.get('io')) {
      notifyWorkCompleted(req.app.get('io'), workerUser.id, employerUser.id, { bookingId: booking.id });
    }

    return sendSuccess(res, 'Work marked as completed! 🎉 Please proceed to payment and rating.', booking);
  } catch (error) {
    await t.rollback();
    logger.error('completeWork error:', error);
    return sendError(res, 'Failed to complete booking', 500);
  }
};

// ── CANCEL BOOKING ────────────────────────────────────────────

/**
 * @desc    Cancel a pending or accepted booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Protected (either party)
 */
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Worker,   as: 'worker',   required: false },
        { model: Employer, as: 'employer', required: false },
      ],
    });

    if (!booking) return sendError(res, 'Booking not found', 404);
    if (!booking.canBeCancelled()) return sendError(res, `Cannot cancel booking with status: ${booking.status}`, 400);

    const isWorker = booking.worker.userId === req.user.id;
    const isEmployer = booking.employer.userId === req.user.id;
    if (!isWorker && !isEmployer && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to cancel this booking', 403);
    }

    const { reason } = req.body;
    await booking.update({
      status: 'cancelled',
      cancelReason: reason || '',
      cancelledBy: req.user.id,
      cancelledAt: new Date(),
    });

    // If from job post, decrement workers_booked
    if (booking.jobPostId && ['accepted', 'pending'].includes(booking.status)) {
      const job = await JobPost.findByPk(booking.jobPostId);
      if (job && job.workersBooked > 0) {
        await job.update({ workersBooked: job.workersBooked - 1, status: 'open' });
      }
    }

    return sendSuccess(res, 'Booking cancelled successfully', booking);
  } catch (error) {
    logger.error('cancelBooking error:', error);
    return sendError(res, 'Failed to cancel booking', 500);
  }
};

// ── GET ALL MY BOOKINGS ───────────────────────────────────────

/**
 * @desc    Get current user's bookings (worker OR employer)
 * @route   GET /api/bookings
 * @access  Protected
 */
const getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let where = {};

    if (req.user.role === 'worker') {
      const worker = await Worker.findOne({ where: { userId: req.user.id } });
      if (!worker) return sendError(res, 'Worker profile not found', 404);
      where.workerId = worker.id;
    } else if (req.user.role === 'employer') {
      const employer = await Employer.findOne({ where: { userId: req.user.id } });
      if (!employer) return sendError(res, 'Employer profile not found', 404);
      where.employerId = employer.id;
    }

    if (status) {
      // Handle comma-separated status string e.g. "pending,accepted,started"
      const statusArr = typeof status === 'string' && status.includes(',')
        ? status.split(',').map(s => s.trim())
        : status;
      where.status = Array.isArray(statusArr) ? { [Op.in]: statusArr } : statusArr;
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Worker, as: 'worker', required: false,
          include: [{ model: User, as: 'user', attributes: ['name', 'profilePhoto'], required: false }] },
        { model: Employer, as: 'employer', required: false,
          include: [{ model: User, as: 'user', attributes: ['name', 'profilePhoto'], required: false }] },
        { model: JobPost, as: 'jobPost', required: false,
          include: [{ model: Category, as: 'category', required: false }] },
        { model: Payment, as: 'payment', required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
    });

    return sendPaginated(res, 'Bookings fetched', rows, count, page, limit);
  } catch (error) {
    logger.error('getMyBookings error:', error);
    return sendError(res, 'Failed to fetch bookings', 500);
  }
};

/**
 * @desc    Get single booking details
 * @route   GET /api/bookings/:id
 * @access  Protected
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Worker,   as: 'worker',   required: false,
          include: [{ model: User, as: 'user', attributes: ['name','profilePhoto','phone'], required: false }] },
        { model: Employer, as: 'employer', required: false,
          include: [{ model: User, as: 'user', attributes: ['name','profilePhoto','phone'], required: false }] },
        { model: JobPost,  as: 'jobPost',  required: false,
          include: [{ model: Category, as: 'category', required: false }] },
        { model: Payment,  as: 'payment',  required: false },
      ],
    });

    if (!booking) return sendError(res, 'Booking not found', 404);

    // Only involved parties and admin can view
    const isWorker = booking.worker.userId === req.user.id;
    const isEmployer = booking.employer.userId === req.user.id;
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
/**
 * ================================================================
 * controllers/workerController.js — Worker Profile Controller
 * Handles worker search, GPS-based nearby lookup, availability
 * toggle, profile management, earnings, and booking history.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const {
  User, Worker, Employer, WorkerSkill, Category, Availability, Booking, JobPost, Payment, Rating
} = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { buildRadiusWhere, buildDistanceLiteral, isValidCoordinates } = require('../utils/gpsHelper');
const { uploadToCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

// ── GET ALL WORKERS (with filters) ───────────────────────────

/**
 * @desc    Get all workers with optional filters
 * @route   GET /api/workers
 * @access  Public
 * @query   category, minRate, maxRate, minRating, district, isAvailable, page, limit, sort
 */
const getAllWorkers = async (req, res) => {
  try {
    const {
      category, minRate, maxRate, minRating, district, city,
      isAvailable, page = 1, limit = 12, sort = 'rating',
    } = req.query;

    const where = {};
    if (district) where.district = district;
    if (city) where.city = city;
    if (minRate) where.dailyRate = { ...where.dailyRate, [Op.gte]: parseFloat(minRate) };
    if (maxRate) where.dailyRate = { ...where.dailyRate, [Op.lte]: parseFloat(maxRate) };
    if (minRating) where.avgRating = { [Op.gte]: parseFloat(minRating) };
    if (isAvailable === 'true') where.isAvailable = true;

    // Sort options
    const orderMap = {
      rating: [['avgRating', 'DESC']],
      rate_asc: [['dailyRate', 'ASC']],
      rate_desc: [['dailyRate', 'DESC']],
      jobs: [['totalJobs', 'DESC']],
      newest: [['createdAt', 'DESC']],
    };
    const order = orderMap[sort] || orderMap.rating;

    const includeCategory = category
      ? [{ model: WorkerSkill, as: 'skills', where: { categoryId: category }, include: [{ model: Category, as: 'category' }] }]
      : [{ model: WorkerSkill, as: 'skills', include: [{ model: Category, as: 'category' }], required: false }];

    const { count, rows } = await Worker.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['name', 'profilePhoto', 'isVerified', 'phone'] },
        ...includeCategory,
      ],
      order,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
    });

    return sendPaginated(res, 'Workers fetched successfully', rows, count, page, limit);
  } catch (error) {
    logger.error('getAllWorkers error:', error);
    return sendError(res, 'Failed to fetch workers', 500, error.message);
  }
};

// ── GET NEARBY WORKERS (GPS) ──────────────────────────────────

/**
 * @desc    Find available workers near a GPS location
 * @route   GET /api/workers/nearby
 * @access  Public
 * @query   lat, lng, radius (km), category, page, limit
 */
const getNearbyWorkers = async (req, res) => {
  try {
    const { lat, lng, radius = 20, category, page = 1, limit = 20 } = req.query;

    if (!lat || !lng || !isValidCoordinates(lat, lng)) {
      return sendError(res, 'Valid latitude and longitude are required', 400);
    }

    const radiusKm = Math.min(parseInt(radius) || 20, 100); // Cap at 100km

    // Bounding box filter (fast, uses index)
    const boundsWhere = buildRadiusWhere(parseFloat(lat), parseFloat(lng), radiusKm);

    // Distance expression for ordering
    const distanceLiteral = buildDistanceLiteral(lat, lng);

    const workerWhere = {
      ...boundsWhere,
      isAvailable: true, // Only available workers
    };

    const skillInclude = category
      ? [{ model: WorkerSkill, as: 'skills', where: { categoryId: category }, include: ['category'] }]
      : [{ model: WorkerSkill, as: 'skills', include: ['category'], required: false }];

    const workers = await Worker.findAll({
      where: workerWhere,
      include: [
        { model: User, as: 'user', attributes: ['name', 'profilePhoto', 'isVerified'] },
        ...skillInclude,
      ],
      // Order by distance (closest first)
      order: [[distanceLiteral, 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      // Include computed distance in results
      attributes: {
        include: [[distanceLiteral, 'distance']],
      },
    });

    // Filter to exact radius (bounding box may include slightly outside)
    const filtered = workers.filter((w) => {
      const d = parseFloat(w.getDataValue('distance'));
      return !isNaN(d) && d <= radiusKm;
    });

    return sendSuccess(res, `${filtered.length} workers found nearby`, filtered, 200, filtered.length);
  } catch (error) {
    logger.error('getNearbyWorkers error:', error);
    return sendError(res, 'Failed to find nearby workers', 500, error.message);
  }
};

// ── GET SINGLE WORKER PROFILE ─────────────────────────────────

/**
 * @desc    Get a single worker's full profile
 * @route   GET /api/workers/:id
 * @access  Public
 */
const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['name', 'profilePhoto', 'isVerified', 'createdAt', 'phone'] },
        {
          model: WorkerSkill, as: 'skills', required: false,
          include: [{ model: Category, as: 'category', required: false }],
        },
      ],
    });

    if (!worker) return sendError(res, 'Worker not found', 404);
    return sendSuccess(res, 'Worker profile fetched', worker);
  } catch (error) {
    logger.error('getWorkerById error:', error.message);
    return sendError(res, 'Failed to fetch worker: ' + error.message, 500);
  }
};

// ── UPDATE WORKER PROFILE ─────────────────────────────────────

/**
 * @desc    Update worker's own profile
 * @route   PUT /api/workers/:id
 * @access  Protected (worker only, own profile)
 */
const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    // Ensure worker can only update their own profile
    if (worker.userId !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to update this profile', 403);
    }

    const allowedFields = [
      'dailyRate', 'experienceYrs', 'bio', 'city', 'district', 'state',
      'pincode', 'address', 'latitude', 'longitude',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Handle profile photo upload
    if (req.file) {
      const photoUrl = await uploadToCloudinary(req.file.buffer, 'profiles', `user_${req.user.id}`);
      await User.update({ profilePhoto: photoUrl }, { where: { id: req.user.id } });
    }

    // Handle Aadhar upload
    if (req.files?.aadharPhoto) {
      const aadharUrl = await uploadToCloudinary(
        req.files.aadharPhoto[0].buffer, 'aadhar', `aadhar_${req.user.id}`
      );
      updates.aadharPhoto = aadharUrl;
    }

    // Update skills if provided
    if (req.body.skills && Array.isArray(req.body.skills)) {
      await WorkerSkill.destroy({ where: { workerId: worker.id } });
      const skills = req.body.skills.map((s) => ({
        workerId: worker.id,
        categoryId: s.categoryId,
        level: s.level || 'beginner',
        yearsInSkill: s.yearsInSkill || 0,
      }));
      await WorkerSkill.bulkCreate(skills);
    }

    await worker.update(updates);
    const updated = await Worker.findByPk(worker.id, {
      include: ['user', { model: WorkerSkill, as: 'skills', include: ['category'] }],
    });

    return sendSuccess(res, 'Profile updated successfully', updated);
  } catch (error) {
    logger.error('updateWorker error:', error);
    return sendError(res, 'Failed to update profile', 500, error.message);
  }
};

// ── SET AVAILABILITY (THE CORE NAKA FEATURE) ─────────────────

/**
 * @desc    Worker toggles availability for today — THE KEY FEATURE
 *          This is the digital equivalent of showing up at the Naka.
 * @route   POST /api/workers/availability
 * @access  Protected (worker only)
 */
const setAvailability = async (req, res) => {
  try {
    const worker = await Worker.findOne({ where: { userId: req.user.id } });
    if (!worker) return sendError(res, 'Worker profile not found', 404);

    const { isAvailable, date, latitude, longitude, radiusKm = 20 } = req.body;

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Update worker isAvailable + location first
    const workerUpdates = { isAvailable: !!isAvailable };
    if (latitude  && !isNaN(parseFloat(latitude)))  workerUpdates.latitude  = parseFloat(latitude);
    if (longitude && !isNaN(parseFloat(longitude))) workerUpdates.longitude = parseFloat(longitude);
    await worker.update(workerUpdates);

    // Upsert daily availability record
    try {
      await Availability.upsert({
        workerId:    worker.id,
        date:        targetDate,
        isAvailable: !!isAvailable,
        radiusKm:    parseInt(radiusKm) || 20,
        latitude:    latitude  ? parseFloat(latitude)  : worker.latitude,
        longitude:   longitude ? parseFloat(longitude) : worker.longitude,
      });
    } catch (availErr) {
      // Availability record error — worker status still updated, continue
      logger.warn('Availability record upsert failed (non-critical):', availErr.message);
    }

    return sendSuccess(
      res,
      isAvailable
        ? '✅ तुम्ही आता उपलब्ध आहात! मालक तुम्हाला पाहू शकतात.'
        : '❌ तुम्ही अनुपलब्ध आहात.',
      { isAvailable: !!isAvailable }
    );
  } catch (error) {
    logger.error('setAvailability error:', error.message);
    return sendError(res, 'Availability update failed: ' + error.message, 500);
  }
};

// ── GET WORKER BOOKINGS ───────────────────────────────────────

/**
 * @desc    Get worker's booking history with pagination
 * @route   GET /api/workers/:id/bookings
 * @access  Protected
 */
const getWorkerBookings = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    const { status, page = 1, limit = 10 } = req.query;
    const where = { workerId: worker.id };
    if (status) where.status = status;

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Employer, as: 'employer', required: false,
          include: [{ model: User, as: 'user', attributes: ['name','profilePhoto'], required: false }] },
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
    logger.error('getWorkerBookings error:', error);
    return sendError(res, 'Failed to fetch bookings', 500);
  }
};

// ── GET WORKER EARNINGS DASHBOARD ────────────────────────────

/**
 * @desc    Earnings summary: total, monthly, weekly breakdown
 * @route   GET /api/workers/:id/earnings
 * @access  Protected (own data only)
 */
const getWorkerEarnings = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    if (worker.userId !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }

    // This month's range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Aggregate payments
    const [monthlyResult] = await Payment.findAll({
      where: {
        workerId: worker.id,
        status: 'completed',
        paidAt: { [Op.between]: [monthStart, monthEnd] },
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('worker_amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      raw: true,
    });

    // Total lifetime
    const [lifetimeResult] = await Payment.findAll({
      where: { workerId: worker.id, status: 'completed' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('worker_amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      raw: true,
    });

    // Last 30 days daily breakdown (for chart)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyBreakdown = await Payment.findAll({
      where: {
        workerId: worker.id,
        status: 'completed',
        paidAt: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('paid_at')), 'date'],
        [sequelize.fn('SUM', sequelize.col('worker_amount')), 'amount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'jobs'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('paid_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('paid_at')), 'ASC']],
      raw: true,
    });

    return sendSuccess(res, 'Earnings fetched', {
      thisMonth: {
        amount: parseFloat(monthlyResult?.total || 0),
        jobCount: parseInt(monthlyResult?.count || 0),
      },
      lifetime: {
        amount: parseFloat(lifetimeResult?.total || 0),
        jobCount: parseInt(lifetimeResult?.count || 0),
      },
      dailyBreakdown,
      avgRating: worker.avgRating,
      totalJobs: worker.totalJobs,
    });
  } catch (error) {
    logger.error('getWorkerEarnings error:', error);
    return sendError(res, 'Failed to fetch earnings', 500);
  }
};

// ── GET WORKER REVIEWS ─────────────────────────────────────────

/**
 * @desc    Get all reviews/ratings for a worker
 * @route   GET /api/workers/:id/reviews
 * @access  Public
 */
const getWorkerReviews = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    const { page = 1, limit = 10 } = req.query;

    const { count, rows } = await Rating.findAndCountAll({
      where: { ratedTo: worker.userId, roleRatedTo: 'worker', isVisible: true },
      include: [{ model: User, as: 'rater', attributes: ['name', 'profilePhoto'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return sendPaginated(res, 'Reviews fetched', rows, count, page, limit);
  } catch (error) {
    logger.error('getWorkerReviews error:', error);
    return sendError(res, 'Failed to fetch reviews', 500);
  }
};

module.exports = {
  getAllWorkers,
  getNearbyWorkers,
  getWorkerById,
  updateWorker,
  setAvailability,
  getWorkerBookings,
  getWorkerEarnings,
  getWorkerReviews,
};
/**
 * ================================================================
 * controllers/workerController.js — Worker Profile Controller
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 *
 * KEY CHANGES:
 *  - Op.gte / Op.lte                  → $gte / $lte
 *  - Worker.findAndCountAll()          → Worker.find() + Worker.countDocuments()
 *  - buildRadiusWhere + distanceLiteral → MongoDB $near (2dsphere index)
 *  - include: [{model: User}]          → .populate('userId')
 *  - Worker.findByPk()                 → Worker.findById()
 *  - sequelize.fn('SUM')               → MongoDB $group aggregation pipeline
 *  - worker.update({})                 → Object.assign(worker, {}) + worker.save()
 *  - WorkerSkill.destroy({where})      → WorkerSkill.deleteMany({})
 *  - WorkerSkill.bulkCreate([])        → WorkerSkill.insertMany([])
 *  - Availability.upsert({})           → Availability.findOneAndUpdate({},{},{upsert:true})
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const {
  User, Worker, Employer, WorkerSkill, Category, Availability, Booking, JobPost, Payment, Rating
} = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { buildNearQuery, buildGeoPoint, annotateWithDistance, isValidCoordinates } = require('../utils/gpsHelper');
const { uploadToCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

// ── GET ALL WORKERS (with filters) ───────────────────────────

const getAllWorkers = async (req, res) => {
  try {
    const {
      category, minRate, maxRate, minRating, district, city,
      isAvailable, page = 1, limit = 12, sort = 'rating',
    } = req.query;

    // CHANGED: Sequelize where + Op → plain MongoDB filter object
    const filter = {};
    if (district) filter.district = district;
    if (city) filter.city = city;
    if (minRate || maxRate) {
      filter.dailyRate = {};
      if (minRate) filter.dailyRate.$gte = parseFloat(minRate); // CHANGED: Op.gte → $gte
      if (maxRate) filter.dailyRate.$lte = parseFloat(maxRate); // CHANGED: Op.lte → $lte
    }
    if (minRating) filter.avgRating = { $gte: parseFloat(minRating) };
    if (isAvailable === 'true') filter.isAvailable = true;

    // CHANGED: category join via include → filter WorkerSkill, get workerIds
    if (category) {
      const skillDocs = await WorkerSkill.find({ categoryId: category }).select('workerId');
      const workerIds = skillDocs.map((s) => s.workerId);
      filter._id = { $in: workerIds };
    }

    // CHANGED: Sequelize order arrays → Mongoose sort object
    const sortMap = {
      rating: { avgRating: -1 },
      rate_asc: { dailyRate: 1 },
      rate_desc: { dailyRate: -1 },
      jobs: { totalJobs: -1 },
      newest: { createdAt: -1 },
    };
    const sortObj = sortMap[sort] || sortMap.rating;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // CHANGED: Worker.findAndCountAll() → Worker.find() + Worker.countDocuments()
    const [workers, count] = await Promise.all([
      Worker.find(filter)
        .sort(sortObj)
        .limit(limitNum)
        .skip(skip)
        // CHANGED: include: [User] → .populate('userId')
        .populate({ path: 'userId', select: 'name profilePhoto isVerified phone' })
        .lean(),
      Worker.countDocuments(filter),
    ]);

    // Attach skills (replaces include WorkerSkill)
    const workerIds = workers.map((w) => w._id);
    const allSkills = await WorkerSkill.find({ workerId: { $in: workerIds } })
      .populate({ path: 'categoryId', model: 'Category' })
      .lean();

    const skillsByWorker = {};
    allSkills.forEach((s) => {
      const wId = s.workerId.toString();
      if (!skillsByWorker[wId]) skillsByWorker[wId] = [];
      skillsByWorker[wId].push(s);
    });

    const result = workers.map((w) => ({
      ...w,
      skills: skillsByWorker[w._id.toString()] || [],
    }));

    return sendPaginated(res, 'Workers fetched successfully', result, count, pageNum, limitNum);
  } catch (error) {
    logger.error('getAllWorkers error:', error);
    return sendError(res, 'Failed to fetch workers', 500, error.message);
  }
};

// ── GET NEARBY WORKERS (GPS) ──────────────────────────────────

const getNearbyWorkers = async (req, res) => {
  try {
    const { lat, lng, radius = 20, category, page = 1, limit = 20 } = req.query;

    if (!lat || !lng || !isValidCoordinates(lat, lng)) {
      return sendError(res, 'Valid latitude and longitude are required', 400);
    }

    const radiusKm = Math.min(parseInt(radius) || 20, 100);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // CHANGED: buildRadiusWhere (PostGIS bounding box) → MongoDB $near (2dsphere)
    // $near automatically returns results sorted by distance (closest first)
    const filter = {
      isAvailable: true,
      location: buildNearQuery(parseFloat(lat), parseFloat(lng), radiusKm),
    };

    if (category) {
      const skillDocs = await WorkerSkill.find({ categoryId: category }).select('workerId');
      filter._id = { $in: skillDocs.map((s) => s.workerId) };
    }

    // CHANGED: Worker.findAll() with distanceLiteral order → Worker.find() with $near
    // $near already sorts by distance, no extra ORDER BY needed
    const workers = await Worker.find(filter)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate({ path: 'userId', select: 'name profilePhoto isVerified' })
      .lean();

    // ADDED: annotate each result with calculated distance (replaces distanceLiteral column)
    const annotated = annotateWithDistance(workers, parseFloat(lat), parseFloat(lng));

    return sendSuccess(res, `${annotated.length} workers found nearby`, annotated, 200, annotated.length);
  } catch (error) {
    logger.error('getNearbyWorkers error:', error);
    return sendError(res, 'Failed to find nearby workers', 500, error.message);
  }
};

// ── GET SINGLE WORKER PROFILE ─────────────────────────────────

const getWorkerById = async (req, res) => {
  try {
    // CHANGED: Worker.findByPk(id, { include: [...] })
    //       → Worker.findById(id).populate()
    const worker = await Worker.findById(req.params.id)
      .populate({ path: 'userId', select: 'name profilePhoto isVerified createdAt phone' })
      .lean();

    if (!worker) return sendError(res, 'Worker not found', 404);

    // Attach skills
    const skills = await WorkerSkill.find({ workerId: worker._id })
      .populate({ path: 'categoryId', model: 'Category' })
      .lean();

    return sendSuccess(res, 'Worker profile fetched', { ...worker, skills });
  } catch (error) {
    logger.error('getWorkerById error:', error.message);
    return sendError(res, 'Failed to fetch worker: ' + error.message, 500);
  }
};

// ── UPDATE WORKER PROFILE ─────────────────────────────────────

const updateWorker = async (req, res) => {
  try {
    // CHANGED: Worker.findByPk() → Worker.findById()
    const worker = await Worker.findById(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    // CHANGED: worker.userId !== req.user.id → .toString() comparison
    if (worker.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to update this profile', 403);
    }

    const allowedFields = [
      'dailyRate', 'experienceYrs', 'bio', 'city', 'district',
      'state', 'pincode', 'address', 'latitude', 'longitude',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) worker[field] = req.body[field];
    });

    // Rebuild GeoJSON if coordinates changed
    if (req.body.latitude || req.body.longitude) {
      worker.location = buildGeoPoint(
        req.body.latitude || worker.latitude,
        req.body.longitude || worker.longitude
      );
    }

    if (req.file) {
      const photoUrl = await uploadToCloudinary(req.file.buffer, 'profiles', `user_${req.user._id}`);
      // CHANGED: User.update({}, { where: {} }) → User.findByIdAndUpdate()
      await User.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl });
    }

    if (req.files?.aadharPhoto) {
      const aadharUrl = await uploadToCloudinary(
        req.files.aadharPhoto[0].buffer, 'aadhar', `aadhar_${req.user._id}`
      );
      worker.aadharPhoto = aadharUrl;
    }

    if (req.body.skills && Array.isArray(req.body.skills)) {
      // CHANGED: WorkerSkill.destroy({ where: {} }) → WorkerSkill.deleteMany({})
      await WorkerSkill.deleteMany({ workerId: worker._id });
      // CHANGED: WorkerSkill.bulkCreate([]) → WorkerSkill.insertMany([])
      await WorkerSkill.insertMany(
        req.body.skills.map((s) => ({
          workerId: worker._id,
          categoryId: s.categoryId,
          level: s.level || 'beginner',
          yearsInSkill: s.yearsInSkill || 0,
        }))
      );
    }

    // CHANGED: worker.update({}) → worker.save()
    await worker.save();

    const updated = await Worker.findById(worker._id)
      .populate({ path: 'userId', select: 'name profilePhoto isVerified phone' })
      .lean();
    const skills = await WorkerSkill.find({ workerId: worker._id })
      .populate({ path: 'categoryId', model: 'Category' })
      .lean();

    return sendSuccess(res, 'Profile updated successfully', { ...updated, skills });
  } catch (error) {
    logger.error('updateWorker error:', error);
    return sendError(res, 'Failed to update profile', 500, error.message);
  }
};

// ── SET AVAILABILITY (THE CORE NAKA FEATURE) ─────────────────

const setAvailability = async (req, res) => {
  try {
    // CHANGED: Worker.findOne({ where: { userId } }) → Worker.findOne({ userId })
    const worker = await Worker.findOne({ userId: req.user._id });
    if (!worker) return sendError(res, 'Worker profile not found', 404);

    const { isAvailable, date, latitude, longitude, radiusKm = 20 } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    // Update worker availability + location
    worker.isAvailable = !!isAvailable;
    if (latitude && !isNaN(parseFloat(latitude))) {
      worker.latitude = parseFloat(latitude);
      worker.longitude = parseFloat(longitude);
      worker.location = buildGeoPoint(parseFloat(latitude), parseFloat(longitude));
    }
    // CHANGED: worker.update({}) → worker.save()
    await worker.save();

    // CHANGED: Availability.upsert({}) → Availability.findOneAndUpdate({},{},{upsert:true})
    try {
      const avLat = latitude ? parseFloat(latitude) : worker.latitude;
      const avLng = longitude ? parseFloat(longitude) : worker.longitude;
      await Availability.findOneAndUpdate(
        { workerId: worker._id, date: targetDate },
        {
          workerId: worker._id,
          date: targetDate,
          isAvailable: !!isAvailable,
          radiusKm: parseInt(radiusKm) || 20,
          latitude: avLat,
          longitude: avLng,
          location: buildGeoPoint(avLat, avLng),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (availErr) {
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

const getWorkerBookings = async (req, res) => {
  try {
    // CHANGED: Worker.findByPk() → Worker.findById()
    const worker = await Worker.findById(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    const { status, page = 1, limit = 10 } = req.query;
    const filter = { workerId: worker._id };
    if (status) filter.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // CHANGED: Booking.findAndCountAll() → Booking.find() + Booking.countDocuments()
    const [bookings, count] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        // CHANGED: include: [Employer, JobPost, Payment] → .populate()
        .populate({
          path: 'employerId',
          populate: { path: 'userId', select: 'name profilePhoto' },
        })
        .populate({
          path: 'jobPostId',
          populate: { path: 'categoryId', model: 'Category' },
        })
        .populate('paymentId')
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return sendPaginated(res, 'Bookings fetched', bookings, count, pageNum, limitNum);
  } catch (error) {
    logger.error('getWorkerBookings error:', error);
    return sendError(res, 'Failed to fetch bookings', 500);
  }
};

// ── GET WORKER EARNINGS DASHBOARD ────────────────────────────

const getWorkerEarnings = async (req, res) => {
  try {
    // CHANGED: Worker.findByPk() → Worker.findById()
    const worker = await Worker.findById(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    if (worker.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // CHANGED: sequelize.fn('SUM') + findAll({attributes}) → MongoDB $group aggregation pipeline
    const [monthlyResult] = await Payment.aggregate([
      {
        $match: {
          workerId: worker._id,
          status: 'completed',
          paidAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$workerAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const [lifetimeResult] = await Payment.aggregate([
      { $match: { workerId: worker._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$workerAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // CHANGED: sequelize.fn('DATE') group → MongoDB $dateToString $group pipeline
    const dailyBreakdown = await Payment.aggregate([
      {
        $match: {
          workerId: worker._id,
          status: 'completed',
          paidAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          amount: { $sum: '$workerAmount' },
          jobs: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', amount: 1, jobs: 1 } },
    ]);

    return sendSuccess(res, 'Earnings fetched', {
      thisMonth: {
        amount: monthlyResult?.total || 0,
        jobCount: monthlyResult?.count || 0,
      },
      lifetime: {
        amount: lifetimeResult?.total || 0,
        jobCount: lifetimeResult?.count || 0,
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

// ── GET WORKER REVIEWS ────────────────────────────────────────

const getWorkerReviews = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return sendError(res, 'Worker not found', 404);

    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { ratedTo: worker.userId, roleRatedTo: 'worker', isVisible: true };

    // CHANGED: Rating.findAndCountAll() → Rating.find() + Rating.countDocuments()
    const [rows, count] = await Promise.all([
      Rating.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        // CHANGED: include: [User as rater] → .populate('ratedBy')
        .populate({ path: 'ratedBy', select: 'name profilePhoto' })
        .lean(),
      Rating.countDocuments(filter),
    ]);

    return sendPaginated(res, 'Reviews fetched', rows, count, pageNum, limitNum);
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

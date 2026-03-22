/**
 * ================================================================
 * controllers/jobController.js — Job Post CRUD Controller
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { JobPost, Employer, Category, Worker, User } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { buildNearQuery, buildGeoPoint, annotateWithDistance, isValidCoordinates } = require('../utils/gpsHelper');
const { sendMulticastPush } = require('../utils/sendPushNotif');
const logger = require('../utils/logger');

// ── GET ALL JOBS ──────────────────────────────────────────────

const getAllJobs = async (req, res) => {
  try {
    const { category, district, city, isUrgent, status = 'open', page = 1, limit = 12, sort = 'newest' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // CHANGED: Sequelize where + Op → plain MongoDB filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.categoryId = category;
    if (district) filter.district = district;
    if (city) filter.city = city;
    if (isUrgent === 'true') filter.isUrgent = true;

    // CHANGED: Sequelize order arrays → Mongoose sort object
    const sortMap = {
      newest: { createdAt: -1 },
      rate_high: { dailyRate: -1 },
      rate_low: { dailyRate: 1 },
      urgent: { isUrgent: -1, createdAt: -1 },
    };

    // CHANGED: JobPost.findAndCountAll() → JobPost.find() + countDocuments()
    const [rows, count] = await Promise.all([
      JobPost.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        // CHANGED: include: [Employer, Category] → .populate()
        .populate({
          path: 'employerId',
          populate: { path: 'userId', select: 'name profilePhoto' },
        })
        .populate('categoryId')
        .lean(),
      JobPost.countDocuments(filter),
    ]);

    return sendPaginated(res, 'Jobs fetched', rows, count, pageNum, limitNum);
  } catch (error) {
    logger.error('getAllJobs error:', error);
    return sendError(res, 'Failed to fetch jobs', 500);
  }
};

// ── GET NEARBY JOBS (GPS) ─────────────────────────────────────

const getNearbyJobs = async (req, res) => {
  try {
    const { lat, lng, radius = 30, category, page = 1, limit = 20 } = req.query;
    if (!lat || !lng || !isValidCoordinates(lat, lng))
      return sendError(res, 'Valid location required', 400);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // CHANGED: buildRadiusWhere (PostGIS bounding box) → buildNearQuery (MongoDB $near)
    const filter = {
      status: 'open',
      location: buildNearQuery(parseFloat(lat), parseFloat(lng), parseInt(radius)),
    };
    if (category) filter.categoryId = category;

    const jobs = await JobPost.find(filter)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate({ path: 'employerId', populate: { path: 'userId', select: 'name profilePhoto isVerified' } })
      .populate('categoryId')
      .lean();

    // ADDED: annotate with distance (replaces SQL distanceLiteral column)
    const annotated = annotateWithDistance(jobs, parseFloat(lat), parseFloat(lng));

    return sendSuccess(res, 'Nearby jobs fetched', annotated, 200, annotated.length);
  } catch (error) {
    logger.error('getNearbyJobs error:', error);
    return sendError(res, 'Failed to fetch nearby jobs', 500);
  }
};

// ── CREATE JOB ────────────────────────────────────────────────

const createJob = async (req, res) => {
  try {
    // CHANGED: Employer.findOne({ where: { userId } }) → Employer.findOne({ userId })
    const employer = await Employer.findOne({ userId: req.user._id });
    if (!employer) return sendError(res, 'Employer profile not found', 404);

    // Build GeoJSON location if coordinates provided (ADDED for $near queries)
    const geoLocation = buildGeoPoint(req.body.latitude, req.body.longitude);

    const job = await JobPost.create({
      ...req.body,
      categoryId: req.body.categoryId,
      employerId: employer._id,
      location: geoLocation,
    });

    // CHANGED: Employer.increment('totalPosts') → Employer.findByIdAndUpdate($inc)
    await Employer.findByIdAndUpdate(employer._id, { $inc: { totalPosts: 1 } });

    // If urgent, push notify nearby available workers
    if (req.body.isUrgent && req.body.latitude && req.body.longitude) {
      // CHANGED: Worker.findAll({ where: { buildRadiusWhere, isAvailable } })
      //       → Worker.find({ location: $near, isAvailable })
      const nearbyWorkers = await Worker.find({
        isAvailable: true,
        location: buildNearQuery(parseFloat(req.body.latitude), parseFloat(req.body.longitude), 25),
      })
        .populate({ path: 'userId', select: 'fcmToken language' })
        .lean();

      const tokens = nearbyWorkers.map((w) => w.userId?.fcmToken).filter(Boolean);

      if (tokens.length > 0) {
        sendMulticastPush(
          tokens,
          '🚨 तातडीचे काम उपलब्ध!',
          `${req.body.title} — ₹${req.body.dailyRate}/दिवस`,
          { jobId: String(job._id), screen: 'JobDetail', isUrgent: 'true' }
        ).catch(() => {});
      }
    }

    // CHANGED: JobPost.findByPk(id, { include }) → JobPost.findById().populate()
    const fullJob = await JobPost.findById(job._id)
      .populate({ path: 'employerId', populate: { path: 'userId', select: 'name profilePhoto' } })
      .populate('categoryId');

    return sendSuccess(res, 'Job posted successfully!', fullJob, 201);
  } catch (error) {
    logger.error('createJob error:', error);
    return sendError(res, 'Failed to create job post', 500, error.message);
  }
};

// ── GET JOB BY ID ─────────────────────────────────────────────

const getJobById = async (req, res) => {
  try {
    // CHANGED: JobPost.findByPk() → JobPost.findById()
    const job = await JobPost.findById(req.params.id)
      .populate({ path: 'employerId', populate: { path: 'userId', select: 'name profilePhoto isVerified' } })
      .populate('categoryId');

    if (!job) return sendError(res, 'Job not found', 404);

    // CHANGED: job.increment('viewsCount') → JobPost.findByIdAndUpdate($inc)
    await JobPost.findByIdAndUpdate(job._id, { $inc: { viewsCount: 1 } });

    return sendSuccess(res, 'Job fetched', job);
  } catch (error) {
    logger.error('getJobById error:', error);
    return sendError(res, 'Failed to fetch job', 500);
  }
};

// ── UPDATE JOB ────────────────────────────────────────────────

const updateJob = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id).populate('employerId');
    if (!job) return sendError(res, 'Job not found', 404);

    // CHANGED: job.employer.userId !== req.user.id → .toString() comparison
    if (job.employerId.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }
    if (['filled', 'completed', 'cancelled'].includes(job.status)) {
      return sendError(res, `Cannot update job with status: ${job.status}`, 400);
    }

    const allowedFields = [
      'title', 'description', 'workersNeeded', 'dailyRate',
      'jobDate', 'endDate', 'durationDays', 'address', 'isUrgent', 'requirements',
    ];
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) job[f] = req.body[f]; });

    // CHANGED: job.update(updates) → job.save()
    await job.save();
    return sendSuccess(res, 'Job updated', job);
  } catch (error) {
    logger.error('updateJob error:', error);
    return sendError(res, 'Failed to update job', 500);
  }
};

// ── CANCEL JOB ────────────────────────────────────────────────

const cancelJob = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id).populate('employerId');
    if (!job) return sendError(res, 'Job not found', 404);
    if (job.employerId.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return sendError(res, 'Not authorized', 403);

    // CHANGED: job.update({ status }) → job.save()
    job.status = 'cancelled';
    await job.save();
    return sendSuccess(res, 'Job cancelled successfully');
  } catch (error) {
    logger.error('cancelJob error:', error);
    return sendError(res, 'Failed to cancel job', 500);
  }
};

module.exports = { getAllJobs, getNearbyJobs, createJob, getJobById, updateJob, cancelJob };

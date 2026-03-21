/**
 * ================================================================
 * controllers/jobController.js — Job Post CRUD Controller
 * Employers post jobs here. Workers see nearby jobs on their dashboard.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { Op } = require('sequelize');
const { JobPost, Employer, Category, Booking, Worker, User } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { buildRadiusWhere, buildDistanceLiteral, isValidCoordinates } = require('../utils/gpsHelper');
const { sendMulticastPush } = require('../utils/sendPushNotif');
const logger = require('../utils/logger');

/**
 * @desc    Get all jobs with filters
 * @route   GET /api/jobs
 * @access  Public
 */
const getAllJobs = async (req, res) => {
  try {
    const { category, district, city, isUrgent, status = 'open', page = 1, limit = 12, sort = 'newest' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (district) where.district = district;
    if (city) where.city = city;
    if (isUrgent === 'true') where.isUrgent = true;

    const orderMap = {
      newest: [['createdAt', 'DESC']],
      rate_high: [['dailyRate', 'DESC']],
      rate_low: [['dailyRate', 'ASC']],
      urgent: [['isUrgent', 'DESC'], ['createdAt', 'DESC']],
    };

    const { count, rows } = await JobPost.findAndCountAll({
      where,
      include: [
        { model: Employer, as: 'employer', include: [{ model: User, as: 'user', attributes: ['name', 'profilePhoto'] }] },
        { model: Category, as: 'category' },
      ],
      order: orderMap[sort] || orderMap.newest,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return sendPaginated(res, 'Jobs fetched', rows, count, page, limit);
  } catch (error) {
    logger.error('getAllJobs error:', error);
    return sendError(res, 'Failed to fetch jobs', 500);
  }
};

/**
 * @desc    Get jobs near worker's location
 * @route   GET /api/jobs/nearby
 * @access  Protected (worker)
 */
const getNearbyJobs = async (req, res) => {
  try {
    const { lat, lng, radius = 30, category, page = 1, limit = 20 } = req.query;
    if (!lat || !lng || !isValidCoordinates(lat, lng)) return sendError(res, 'Valid location required', 400);

    const boundsWhere = buildRadiusWhere(parseFloat(lat), parseFloat(lng), parseInt(radius));
    const distanceLiteral = buildDistanceLiteral(lat, lng);

    const where = { ...boundsWhere, status: 'open' };
    if (category) where.categoryId = category;

    const jobs = await JobPost.findAll({
      where,
      include: [
        { model: Employer, as: 'employer', include: [{ model: User, as: 'user', attributes: ['name', 'profilePhoto', 'isVerified'] }] },
        { model: Category, as: 'category' },
      ],
      order: [['isUrgent', 'DESC'], [distanceLiteral, 'ASC']],
      attributes: { include: [[distanceLiteral, 'distance']] },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return sendSuccess(res, 'Nearby jobs fetched', jobs, 200, jobs.length);
  } catch (error) {
    logger.error('getNearbyJobs error:', error);
    return sendError(res, 'Failed to fetch nearby jobs', 500);
  }
};

/**
 * @desc    Create a new job post
 * @route   POST /api/jobs
 * @access  Protected (employer)
 */
const createJob = async (req, res) => {
  try {
    const employer = await Employer.findOne({ where: { userId: req.user.id } });
    if (!employer) return sendError(res, 'Employer profile not found', 404);

    const job = await JobPost.create({ ...req.body, employerId: employer.id });

    // Increment employer's post count
    await Employer.increment('totalPosts', { where: { id: employer.id } });

    // If urgent, send push to all nearby available workers
    if (req.body.isUrgent && req.body.latitude && req.body.longitude) {
      const nearbyWorkers = await Worker.findAll({
        where: {
          ...buildRadiusWhere(parseFloat(req.body.latitude), parseFloat(req.body.longitude), 25),
          isAvailable: true,
        },
        include: [{ model: User, as: 'user', attributes: ['fcmToken', 'language'] }],
      });

      const tokens = nearbyWorkers
        .map(w => w.user?.fcmToken)
        .filter(Boolean);

      if (tokens.length > 0) {
        sendMulticastPush(
          tokens,
          '🚨 तातडीचे काम उपलब्ध!',
          `${req.body.title} — ₹${req.body.dailyRate}/दिवस`,
          { jobId: String(job.id), screen: 'JobDetail', isUrgent: 'true' }
        ).catch(() => {});
      }
    }

    const fullJob = await JobPost.findByPk(job.id, { include: ['employer', 'category'] });
    return sendSuccess(res, 'Job posted successfully!', fullJob, 201);
  } catch (error) {
    logger.error('createJob error:', error);
    return sendError(res, 'Failed to create job post', 500, error.message);
  }
};

/**
 * @desc    Get single job with details and applicants
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJobById = async (req, res) => {
  try {
    const job = await JobPost.findByPk(req.params.id, {
      include: [
        { model: Employer, as: 'employer', include: [{ model: User, as: 'user', attributes: ['name', 'profilePhoto', 'isVerified'] }] },
        { model: Category, as: 'category' },
      ],
    });

    if (!job) return sendError(res, 'Job not found', 404);

    // Increment view count
    await job.increment('viewsCount');

    return sendSuccess(res, 'Job fetched', job);
  } catch (error) {
    logger.error('getJobById error:', error);
    return sendError(res, 'Failed to fetch job', 500);
  }
};

/**
 * @desc    Update job post
 * @route   PUT /api/jobs/:id
 * @access  Protected (employer, own job)
 */
const updateJob = async (req, res) => {
  try {
    const job = await JobPost.findByPk(req.params.id, { include: ['employer'] });
    if (!job) return sendError(res, 'Job not found', 404);
    if (job.employer.userId !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }
    if (['filled', 'completed', 'cancelled'].includes(job.status)) {
      return sendError(res, `Cannot update job with status: ${job.status}`, 400);
    }

    const allowedFields = ['title', 'description', 'workersNeeded', 'dailyRate', 'jobDate', 'endDate', 'durationDays', 'address', 'isUrgent', 'requirements'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await job.update(updates);
    return sendSuccess(res, 'Job updated', job);
  } catch (error) {
    logger.error('updateJob error:', error);
    return sendError(res, 'Failed to update job', 500);
  }
};

/**
 * @desc    Cancel/delete a job post
 * @route   DELETE /api/jobs/:id
 * @access  Protected (employer)
 */
const cancelJob = async (req, res) => {
  try {
    const job = await JobPost.findByPk(req.params.id, { include: ['employer'] });
    if (!job) return sendError(res, 'Job not found', 404);
    if (job.employer.userId !== req.user.id && req.user.role !== 'admin') return sendError(res, 'Not authorized', 403);

    await job.update({ status: 'cancelled' });
    return sendSuccess(res, 'Job cancelled successfully');
  } catch (error) {
    logger.error('cancelJob error:', error);
    return sendError(res, 'Failed to cancel job', 500);
  }
};

module.exports = { getAllJobs, getNearbyJobs, createJob, getJobById, updateJob, cancelJob };


/**
 * ================================================================
 * controllers/paymentController.js — Razorpay Payment Controller
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

module.exports = { getAllJobs, getNearbyJobs, createJob, getJobById, updateJob, cancelJob };

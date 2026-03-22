/**
 * routes/ratingRoutes.js
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const { submitRating } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');
const { Rating, User } = require('../models');
const { sendError, sendPaginated } = require('../utils/responseHelper');

router.post('/', protect, submitRating);

router.get('/worker/:id', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { ratedTo: req.params.id, roleRatedTo: 'worker', isVisible: true };

    // CHANGED: Rating.findAndCountAll() → Rating.find() + countDocuments()
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

    return sendPaginated(res, 'Worker ratings', rows, count, pageNum, limitNum);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

router.get('/employer/:id', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { ratedTo: req.params.id, roleRatedTo: 'employer', isVisible: true };

    const [rows, count] = await Promise.all([
      Rating.find(filter)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .populate({ path: 'ratedBy', select: 'name profilePhoto' })
        .lean(),
      Rating.countDocuments(filter),
    ]);

    return sendPaginated(res, 'Employer ratings', rows, count, pageNum, limitNum);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

module.exports = router;

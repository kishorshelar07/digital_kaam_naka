/**
 * routes/ratingRoutes.js
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
    const { count, rows } = await Rating.findAndCountAll({
      where: { ratedTo: req.params.id, roleRatedTo: 'worker', isVisible: true },
      include: [{ model: User, as: 'rater', attributes: ['name', 'profilePhoto'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
    });
    return sendPaginated(res, 'Worker ratings', rows, count, page, limit);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

router.get('/employer/:id', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { count, rows } = await Rating.findAndCountAll({
      where: { ratedTo: req.params.id, roleRatedTo: 'employer', isVisible: true },
      include: [{ model: User, as: 'rater', attributes: ['name', 'profilePhoto'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * parseInt(limit),
    });
    return sendPaginated(res, 'Employer ratings', rows, count, page, limit);
  } catch (e) {
    return sendError(res, 'Failed', 500);
  }
});

module.exports = router;

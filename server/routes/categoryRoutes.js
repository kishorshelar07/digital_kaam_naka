/**
 * routes/categoryRoutes.js
 * FIXED: Sequelize findAll → Mongoose find
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');

router.get('/', async (req, res) => {
  try {
    // FIXED: Category.findAll({ where, order }) → Category.find().sort()
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    return sendSuccess(res, 'Categories fetched', categories);
  } catch (e) {
    return sendError(res, 'Failed to fetch categories', 500, e.message);
  }
});

module.exports = router;

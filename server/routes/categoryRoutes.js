/**
 * routes/categoryRoutes.js
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });
    return sendSuccess(res, 'Categories fetched', categories);
  } catch (e) {
    return sendError(res, 'Failed to fetch categories', 500);
  }
});

module.exports = router;

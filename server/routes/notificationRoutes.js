/**
 * routes/notificationRoutes.js
 * Author: Digital Kaam Naka Dev Team
 */
const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead, markOneRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',         protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markOneRead);

module.exports = router;

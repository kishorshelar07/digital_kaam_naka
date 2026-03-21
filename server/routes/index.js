/**
 * ================================================================
 * routes/index.js — Master Route File
 * Registers all API route groups under /api prefix.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const express = require('express');
const router = express.Router();

const authRoutes         = require('./authRoutes');
const workerRoutes       = require('./workerRoutes');
const employerRoutes     = require('./employerRoutes');
const jobRoutes          = require('./jobRoutes');
const bookingRoutes      = require('./bookingRoutes');
const paymentRoutes      = require('./paymentRoutes');
const ratingRoutes       = require('./ratingRoutes');
const notificationRoutes = require('./notificationRoutes');
const locationRoutes     = require('./locationRoutes');
const categoryRoutes     = require('./categoryRoutes');
const adminRoutes        = require('./adminRoutes');

// Health check endpoint (no auth needed — used by load balancers)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Kaam Naka API is running ✅',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    env: process.env.NODE_ENV,
  });
});

// Mount all route groups
router.use('/auth',          authRoutes);
router.use('/workers',       workerRoutes);
router.use('/employers',     employerRoutes);
router.use('/jobs',          jobRoutes);
router.use('/bookings',      bookingRoutes);
router.use('/payments',      paymentRoutes);
router.use('/ratings',       ratingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/locations',     locationRoutes);
router.use('/categories',    categoryRoutes);
router.use('/admin',         adminRoutes);

module.exports = router;

/**
 * routes/authRoutes.js — Authentication Routes
 * Author: Digital Kaam Naka Dev Team
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { sendOtp, verifyOtp, register, logout, getMe, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validators } = require('../middleware/validateMiddleware');
const { uploadProfilePhoto } = require('../middleware/uploadMiddleware');

// Rate limit — relaxed in development
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: { success: false, message: 'Too many OTP requests. Please wait.' },
  skip: () => process.env.NODE_ENV === 'development',
});

router.post('/send-otp',      authLimiter, validators.sendOtp,   sendOtp);
router.post('/verify-otp',    authLimiter, validators.verifyOtp, verifyOtp);
router.post('/register',      protect, uploadProfilePhoto, register);
router.post('/logout',        protect, logout);
router.get('/me',             protect, getMe);
router.post('/refresh-token', refreshToken);

module.exports = router;
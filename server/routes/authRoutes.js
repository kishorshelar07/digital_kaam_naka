/**
 * routes/authRoutes.js — Authentication Routes
 * UPDATED:
 *  - Added POST /check-user   — phone registered? hasPassword?
 *  - Added POST /login-password — mobile + password login
 * Author: Digital Kaam Naka Dev Team
 */

const express    = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');

const {
  checkUser,
  sendOtp,
  verifyOtp,
  loginWithPassword,
  register,
  logout,
  getMe,
  refreshToken,
} = require('../controllers/authController');

const { protect }             = require('../middleware/authMiddleware');
const { validators }          = require('../middleware/validateMiddleware');
const { uploadProfilePhoto }  = require('../middleware/uploadMiddleware');

// Rate limiter — strict in production, relaxed in development
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      process.env.NODE_ENV === 'production' ? 5 : 100,
  message:  { success: false, message: 'जास्त requests. थोड्या वेळाने पुन्हा करा.' },
  skip:     () => process.env.NODE_ENV === 'development',
});

// Login limiter — slightly more lenient (password attempts)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      process.env.NODE_ENV === 'production' ? 10 : 200,
  message:  { success: false, message: 'जास्त login प्रयत्न. 15 मिनिटांनी पुन्हा करा.' },
  skip:     () => process.env.NODE_ENV === 'development',
});

// ── Public routes ─────────────────────────────────────────────
router.post('/check-user',      authLimiter,  checkUser);          // NEW: is phone registered?
router.post('/send-otp',        authLimiter,  validators.sendOtp,   sendOtp);
router.post('/verify-otp',      authLimiter,  validators.verifyOtp, verifyOtp);
router.post('/login-password',  loginLimiter, loginWithPassword);   // NEW: mobile + password login
router.post('/refresh-token',   refreshToken);

// ── Protected routes (need valid JWT) ─────────────────────────
router.post('/register', protect, uploadProfilePhoto, register);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);

module.exports = router;
/**
 * ================================================================
 * controllers/authController.js — Authentication Controller
 * Handles OTP-based login (primary), registration, logout.
 * Flow: sendOtp → verifyOtp → register (if new user) → JWT issued
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { User, Worker, Employer } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setTokenCookie,
  clearTokenCookie,
  generateOTP,
  getOtpExpiry,
} = require('../utils/tokenHelper');
const { sendOtpSMS } = require('../utils/sendSMS');
const { uploadToCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
const OTP_BLOCK_MINS   = parseInt(process.env.OTP_BLOCK_MINS)   || 30;
const OTP_EXPIRE_MINS  = parseInt(process.env.OTP_EXPIRE_MINS)  || 10;

// ── SEND OTP ─────────────────────────────────────────────────

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find or prepare user record
    let user = await User.scope('withOtp').findOne({ where: { phone } });

    if (user) {
      // Check if user is blocked from OTP requests
      if (user.otpBlockedUntil && new Date() < new Date(user.otpBlockedUntil)) {
        const minsLeft = Math.ceil((new Date(user.otpBlockedUntil) - new Date()) / 60000);
        return sendError(res, `Too many attempts. Try again in ${minsLeft} minutes.`, 429);
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = getOtpExpiry(OTP_EXPIRE_MINS);

    // In development, log OTP (never in production)
    if (process.env.NODE_ENV === 'development') {
      logger.info(`📱 DEV OTP for ${phone}: ${otp}`);
    }

    if (user) {
      // Reset attempts and set new OTP
      await user.update({
        otp,
        otpExpires,
        otpAttempts: 0,
        otpBlockedUntil: null,
      });
    } else {
      // User doesn't exist yet — store OTP temporarily
      // They'll complete registration after OTP verification
      user = await User.create({
        phone,
        otp,
        otpExpires,
        role: 'worker', // Temporary, updated during registration
        name: 'Pending Registration',
        isVerified: false,
        isActive: true,
      });
    }

    // Send OTP via SMS (gracefully handle SMS failure)
    const smsSent = await sendOtpSMS(phone, otp, 'mr');

    return sendSuccess(res, 'OTP sent successfully', {
      phone,
      otpSent: smsSent,
      // Include OTP in response ONLY in development mode
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
      expiresInMinutes: OTP_EXPIRE_MINS,
    });
  } catch (error) {
    logger.error('sendOtp error:', error);
    return sendError(res, 'Failed to send OTP. Please try again.', 500);
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────

/**
 * @desc    Verify OTP and login or redirect to registration
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.scope('withOtp').findOne({ where: { phone } });

    if (!user) {
      return sendError(res, 'Phone number not found. Please request OTP first.', 404);
    }

    // Verify OTP using model method
    const { valid, reason } = user.verifyOtp(otp);

    if (!valid) {
      // Increment failed attempts
      const attempts = (user.otpAttempts || 0) + 1;
      const updateData = { otpAttempts: attempts };

      // Block after max attempts
      if (attempts >= OTP_MAX_ATTEMPTS) {
        updateData.otpBlockedUntil = new Date(Date.now() + OTP_BLOCK_MINS * 60 * 1000);
        updateData.otpAttempts = 0;
      }

      await user.update(updateData);
      return sendError(res, reason, 400);
    }

    // OTP verified — clear it from DB
    await user.update({
      otp: null,
      otpExpires: null,
      otpAttempts: 0,
      otpBlockedUntil: null,
      lastLogin: new Date(),
    });

    // Check if user has completed registration
    const isRegistered = user.name !== 'Pending Registration';
    const hasProfile = await (
      user.role === 'worker'
        ? Worker.findOne({ where: { userId: user.id } })
        : Employer.findOne({ where: { userId: user.id } })
    );

    const needsRegistration = !isRegistered || !hasProfile;

    if (needsRegistration) {
      // Issue a short-lived registration token
      const regToken = generateAccessToken({ id: user.id, role: 'pending', phone });
      setTokenCookie(res, regToken);

      return sendSuccess(res, 'OTP verified. Please complete registration.', {
        needsRegistration: true,
        userId: user.id,
        phone,
        token: regToken,
      });
    }

    // Fully registered — issue full access token
    const tokenPayload = { id: user.id, role: user.role, phone: user.phone };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    setTokenCookie(res, accessToken);

    // Fetch user with profile
    const userWithProfile = await User.findByPk(user.id, {
      include: [
        { model: Worker, as: 'workerProfile', required: false },
        { model: Employer, as: 'employerProfile', required: false },
      ],
    });

    return sendSuccess(res, 'Login successful! Welcome back.', {
      needsRegistration: false,
      user: userWithProfile,
      token: accessToken,
    });
  } catch (error) {
    logger.error('verifyOtp error:', error);
    return sendError(res, 'OTP verification failed. Please try again.', 500);
  }
};

// ── COMPLETE REGISTRATION ─────────────────────────────────────

/**
 * @desc    Complete profile after OTP verification
 * @route   POST /api/auth/register
 * @access  Protected (requires registration token)
 */
const register = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      name, role, language,
      // Worker-specific
      dailyRate, city, district, state, pincode, experienceYrs, bio,
      // Employer-specific
      companyName, employerType, gstNumber,
      // Shared
      latitude, longitude, address,
    } = req.body;

    if (!['worker', 'employer'].includes(role)) {
      return sendError(res, 'Role must be worker or employer', 400);
    }

    // Update user base profile
    await User.update(
      { name, role, language: language || 'mr' },
      { where: { id: userId } }
    );

    // Handle profile photo upload
    let profilePhotoUrl = null;
    if (req.file) {
      profilePhotoUrl = await uploadToCloudinary(req.file.buffer, 'profiles', `user_${userId}`);
      await User.update({ profilePhoto: profilePhotoUrl }, { where: { id: userId } });
    }

    let profile;

    if (role === 'worker') {
      // Create or update worker profile
      [profile] = await Worker.upsert({
        userId,
        dailyRate: parseFloat(dailyRate),
        city, district,
        state: state || 'Maharashtra',
        pincode, address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        experienceYrs: parseInt(experienceYrs) || 0,
        bio: bio || '',
      }, { returning: true });
    } else {
      // Create or update employer profile
      [profile] = await Employer.upsert({
        userId,
        companyName: companyName || '',
        employerType: employerType || 'individual',
        gstNumber: gstNumber || null,
        city, district,
        state: state || 'Maharashtra',
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      }, { returning: true });
    }

    // Issue full access token now that registration is complete
    const tokenPayload = { id: userId, role, phone: req.user.phone };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: userId });

    setTokenCookie(res, accessToken);

    const user = await User.findByPk(userId, {
      include: [
        { model: Worker, as: 'workerProfile', required: false },
        { model: Employer, as: 'employerProfile', required: false },
      ],
    });

    return sendSuccess(res, 'Registration complete! Welcome to Digital Kaam Naka! 🎉', {
      user,
      token: accessToken,
    }, 201);
  } catch (error) {
    logger.error('register error:', error);
    return sendError(res, 'Registration failed. Please try again.', 500, error.message);
  }
};

// ── LOGOUT ────────────────────────────────────────────────────

/**
 * @desc    Logout user — clear JWT cookie
 * @route   POST /api/auth/logout
 * @access  Protected
 */
const logout = async (req, res) => {
  clearTokenCookie(res);
  return sendSuccess(res, 'Logged out successfully');
};

// ── GET CURRENT USER ──────────────────────────────────────────

/**
 * @desc    Get currently logged in user with profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Worker, as: 'workerProfile', required: false,
          include: [{ association: 'skills', include: ['category'] }],
        },
        { model: Employer, as: 'employerProfile', required: false },
      ],
    });

    return sendSuccess(res, 'User profile fetched', user);
  } catch (error) {
    logger.error('getMe error:', error);
    return sendError(res, 'Failed to fetch user profile', 500);
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────

/**
 * @desc    Issue new access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public (requires valid refresh token in cookie)
 */
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return sendError(res, 'Refresh token not provided', 401);

    const decoded = verifyToken(token, true);
    if (!decoded) return sendError(res, 'Invalid refresh token', 401);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) return sendError(res, 'User not found', 401);

    const newAccessToken = generateAccessToken({ id: user.id, role: user.role, phone: user.phone });
    setTokenCookie(res, newAccessToken);

    return sendSuccess(res, 'Token refreshed', { token: newAccessToken });
  } catch (error) {
    logger.error('refreshToken error:', error);
    return sendError(res, 'Token refresh failed', 500);
  }
};

module.exports = { sendOtp, verifyOtp, register, logout, getMe, refreshToken };

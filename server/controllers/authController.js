/**
 * ================================================================
 * controllers/authController.js — Authentication Controller
 * FIXED:
 *  - Removed .populate('workerProfile') / .populate('employerProfile')
 *    because User schema has NO workerProfile/employerProfile fields.
 *    Instead, manually fetch Worker/Employer by userId after auth.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { User, Worker, Employer, WorkerSkill } = require('../models');
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
const { buildGeoPoint } = require('../utils/gpsHelper');
const { sendOtpSMS } = require('../utils/sendSMS');
const { uploadToCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
const OTP_BLOCK_MINS   = parseInt(process.env.OTP_BLOCK_MINS)   || 30;
const OTP_EXPIRE_MINS  = parseInt(process.env.OTP_EXPIRE_MINS)  || 10;

// ── HELPER: Build full user object with profile ───────────────
// FIXED: User has no workerProfile/employerProfile refs.
// We fetch Worker/Employer separately via userId and attach manually.
const getUserWithProfile = async (userId, role) => {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  if (role === 'worker' || user.role === 'worker') {
    const workerProfile = await Worker.findOne({ userId }).lean();
    if (workerProfile) {
      const skills = await WorkerSkill.find({ workerId: workerProfile._id })
        .populate({ path: 'categoryId', model: 'Category' })
        .lean();
      user.workerProfile = { ...workerProfile, skills };
    }
  } else if (role === 'employer' || user.role === 'employer') {
    user.employerProfile = await Employer.findOne({ userId }).lean();
  }

  return user;
};

// ── SEND OTP ──────────────────────────────────────────────────

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    let user = await User.findOne({ phone }).select(
      '+otp +otpExpires +otpAttempts +otpBlockedUntil'
    );

    if (user?.otpBlockedUntil && new Date() < new Date(user.otpBlockedUntil)) {
      const minsLeft = Math.ceil((new Date(user.otpBlockedUntil) - new Date()) / 60000);
      return sendError(res, `Too many attempts. Try again in ${minsLeft} minutes.`, 429);
    }

    const otp = generateOTP();
    const otpExpires = getOtpExpiry(OTP_EXPIRE_MINS);

    if (process.env.NODE_ENV === 'development') {
      logger.info(`📱 DEV OTP for ${phone}: ${otp}`);
    }

    if (user) {
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.otpAttempts = 0;
      user.otpBlockedUntil = null;
      await user.save();
    } else {
      user = await User.create({
        phone,
        otp,
        otpExpires,
        role: 'worker',
        name: 'Pending Registration',
        isVerified: false,
        isActive: true,
      });
    }

    const smsSent = await sendOtpSMS(phone, otp, 'mr');

    return sendSuccess(res, 'OTP sent successfully', {
      phone,
      otpSent: smsSent,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
      expiresInMinutes: OTP_EXPIRE_MINS,
    });
  } catch (error) {
    logger.error('sendOtp error:', error);
    return sendError(res, 'Failed to send OTP. Please try again.', 500);
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone }).select(
      '+otp +otpExpires +otpAttempts +otpBlockedUntil'
    );

    if (!user) return sendError(res, 'Phone number not found. Please request OTP first.', 404);

    const { valid, reason } = user.verifyOtp(otp);

    if (!valid) {
      const attempts = (user.otpAttempts || 0) + 1;
      user.otpAttempts = attempts;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        user.otpBlockedUntil = new Date(Date.now() + OTP_BLOCK_MINS * 60 * 1000);
        user.otpAttempts = 0;
      }
      await user.save();
      return sendError(res, reason, 400);
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    user.otpBlockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const isRegistered = user.name !== 'Pending Registration';

    // FIXED: check profile via Worker/Employer.findOne({ userId })
    const hasProfile = await (
      user.role === 'worker'
        ? Worker.findOne({ userId: user._id })
        : Employer.findOne({ userId: user._id })
    );

    const needsRegistration = !isRegistered || !hasProfile;

    if (needsRegistration) {
      const regToken = generateAccessToken({ id: user._id, role: 'pending', phone });
      setTokenCookie(res, regToken);
      return sendSuccess(res, 'OTP verified. Please complete registration.', {
        needsRegistration: true,
        userId: user._id,
        phone,
        token: regToken,
      });
    }

    const tokenPayload = { id: user._id, role: user.role, phone: user.phone };
    const accessToken = generateAccessToken(tokenPayload);
    generateRefreshToken({ id: user._id });
    setTokenCookie(res, accessToken);

    // FIXED: fetch profile manually instead of .populate('workerProfile')
    const userWithProfile = await getUserWithProfile(user._id, user.role);

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

const register = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name, role, language,
      dailyRate, city, district, state, pincode, experienceYrs, bio,
      companyName, employerType, gstNumber,
      latitude, longitude, address,
    } = req.body;

    if (!['worker', 'employer'].includes(role)) {
      return sendError(res, 'Role must be worker or employer', 400);
    }

    await User.findByIdAndUpdate(userId, {
      name,
      role,
      language: language || 'mr',
    });

    let profilePhotoUrl = null;
    if (req.file) {
      profilePhotoUrl = await uploadToCloudinary(req.file.buffer, 'profiles', `user_${userId}`);
      await User.findByIdAndUpdate(userId, { profilePhoto: profilePhotoUrl });
    }

    const location = buildGeoPoint(latitude, longitude);
    const latNum = latitude ? parseFloat(latitude) : null;
    const lngNum = longitude ? parseFloat(longitude) : null;

    if (role === 'worker') {
      await Worker.findOneAndUpdate(
        { userId },
        {
          userId,
          dailyRate: parseFloat(dailyRate),
          city, district,
          state: state || 'Maharashtra',
          pincode, address,
          latitude: latNum,
          longitude: lngNum,
          location,
          experienceYrs: parseInt(experienceYrs) || 0,
          bio: bio || '',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Save skills if provided
      const skills = req.body.skills ? JSON.parse(req.body.skills) : [];
      if (skills.length > 0) {
        const worker = await Worker.findOne({ userId });
        if (worker) {
          const { WorkerSkill } = require('../models');
          await WorkerSkill.deleteMany({ workerId: worker._id });
          await WorkerSkill.insertMany(
            skills.map(s => ({
              workerId: worker._id,
              categoryId: s.categoryId,
              level: s.level || 'experienced',
              yearsInSkill: s.yearsInSkill || 0,
            }))
          );
        }
      }
    } else {
      await Employer.findOneAndUpdate(
        { userId },
        {
          userId,
          companyName: companyName || '',
          employerType: employerType || 'individual',
          gstNumber: gstNumber || null,
          city, district,
          state: state || 'Maharashtra',
          address,
          latitude: latNum,
          longitude: lngNum,
          location,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const tokenPayload = { id: userId, role, phone: req.user.phone };
    const accessToken = generateAccessToken(tokenPayload);
    generateRefreshToken({ id: userId });
    setTokenCookie(res, accessToken);

    // FIXED: fetch profile manually instead of .populate('workerProfile')
    const user = await getUserWithProfile(userId, role);

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

const logout = async (req, res) => {
  clearTokenCookie(res);
  return sendSuccess(res, 'Logged out successfully');
};

// ── GET CURRENT USER ──────────────────────────────────────────

const getMe = async (req, res) => {
  try {
    // FIXED: fetch profile manually instead of .populate('workerProfile')
    const user = await getUserWithProfile(req.user._id, req.user.role);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'User profile fetched', user);
  } catch (error) {
    logger.error('getMe error:', error);
    return sendError(res, 'Failed to fetch user profile', 500);
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return sendError(res, 'Refresh token not provided', 401);

    const decoded = verifyToken(token, true);
    if (!decoded) return sendError(res, 'Invalid refresh token', 401);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return sendError(res, 'User not found', 401);

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role, phone: user.phone });
    setTokenCookie(res, newAccessToken);

    return sendSuccess(res, 'Token refreshed', { token: newAccessToken });
  } catch (error) {
    logger.error('refreshToken error:', error);
    return sendError(res, 'Token refresh failed', 500);
  }
};

module.exports = { sendOtp, verifyOtp, register, logout, getMe, refreshToken };

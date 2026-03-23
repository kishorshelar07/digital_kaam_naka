/**
 * ================================================================
 * controllers/authController.js — Authentication Controller
 * UPDATED:
 *  - Added checkUser() — phone registered check + hasPassword
 *  - Added loginWithPassword() — mobile + password login
 *  - Modified register() — now accepts optional password
 *  - Fixed: refreshToken now saved properly as cookie
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { User, Worker, Employer, WorkerSkill } = require('../models');
const { sendSuccess, sendError }              = require('../utils/responseHelper');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setTokenCookie,
  clearTokenCookie,
  generateOTP,
  getOtpExpiry,
} = require('../utils/tokenHelper');
const { buildGeoPoint }        = require('../utils/gpsHelper');
const { sendOtpSMS }           = require('../utils/sendSMS');
const { uploadToCloudinary }   = require('../config/cloudinary');
const logger                   = require('../utils/logger');

const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
const OTP_BLOCK_MINS   = parseInt(process.env.OTP_BLOCK_MINS)   || 30;
const OTP_EXPIRE_MINS  = parseInt(process.env.OTP_EXPIRE_MINS)  || 10;

// ── HELPER: Set refresh token as httpOnly cookie ──────────────
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// ── HELPER: Build full user object with profile ───────────────
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

// ── CHECK USER ────────────────────────────────────────────────
// New endpoint — tells Login page if phone is registered & has password
const checkUser = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return sendError(res, 'कृपया valid 10 अंकी mobile number टाका.', 400);
    }

    const user = await User.findOne({ phone }).select('+password');

    // A user is "registered" only if they completed registration
    const isRegistered = !!(user && user.name !== 'Pending Registration');

    return sendSuccess(res, 'User status fetched', {
      registered:  isRegistered,
      hasPassword: isRegistered && !!user.password,
    });
  } catch (error) {
    logger.error('checkUser error:', error);
    return sendError(res, 'Something went wrong. Please try again.', 500);
  }
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
      return sendError(res, `जास्त प्रयत्न झाले. ${minsLeft} मिनिटांनी पुन्हा करा.`, 429);
    }

    const otp        = generateOTP();
    const otpExpires = getOtpExpiry(OTP_EXPIRE_MINS);

    if (process.env.NODE_ENV === 'development') {
      logger.info(`📱 DEV OTP for ${phone}: ${otp}`);
    }

    if (user) {
      user.otp             = otp;
      user.otpExpires      = otpExpires;
      user.otpAttempts     = 0;
      user.otpBlockedUntil = null;
      await user.save();
    } else {
      user = await User.create({
        phone,
        otp,
        otpExpires,
        role:       'worker',
        name:       'Pending Registration',
        isVerified: false,
        isActive:   true,
      });
    }

    const smsSent = await sendOtpSMS(phone, otp, 'mr');

    return sendSuccess(res, 'OTP पाठवला!', {
      phone,
      otpSent:        smsSent,
      expiresInMinutes: OTP_EXPIRE_MINS,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (error) {
    logger.error('sendOtp error:', error);
    return sendError(res, 'OTP पाठवता आला नाही. पुन्हा प्रयत्न करा.', 500);
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone }).select(
      '+otp +otpExpires +otpAttempts +otpBlockedUntil'
    );

    if (!user) return sendError(res, 'Phone number सापडला नाही. आधी OTP मागवा.', 404);

    const { valid, reason } = user.verifyOtp(otp);

    if (!valid) {
      const attempts = (user.otpAttempts || 0) + 1;
      user.otpAttempts = attempts;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        user.otpBlockedUntil = new Date(Date.now() + OTP_BLOCK_MINS * 60 * 1000);
        user.otpAttempts     = 0;
      }
      await user.save();
      return sendError(res, reason, 400);
    }

    // Clear OTP fields
    user.otp             = null;
    user.otpExpires      = null;
    user.otpAttempts     = 0;
    user.otpBlockedUntil = null;
    user.lastLogin       = new Date();
    await user.save();

    const isRegistered = user.name !== 'Pending Registration';
    const hasProfile   = await (
      user.role === 'worker'
        ? Worker.findOne({ userId: user._id })
        : Employer.findOne({ userId: user._id })
    );
    const needsRegistration = !isRegistered || !hasProfile;

    if (needsRegistration) {
      // Temp token — only valid for completing registration
      const regToken = generateAccessToken({ id: user._id, role: 'pending', phone });
      setTokenCookie(res, regToken);
      return sendSuccess(res, 'OTP verified. नोंदणी पूर्ण करा.', {
        needsRegistration: true,
        userId: user._id,
        phone,
        token:  regToken,
      });
    }

    // Existing user — full login
    const tokenPayload   = { id: user._id, role: user.role, phone: user.phone };
    const accessToken    = generateAccessToken(tokenPayload);
    const refreshToken   = generateRefreshToken({ id: user._id });
    setTokenCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    const userWithProfile = await getUserWithProfile(user._id, user.role);

    return sendSuccess(res, 'Login यशस्वी! स्वागत आहे 🎉', {
      needsRegistration: false,
      user:  userWithProfile,
      token: accessToken,
    });
  } catch (error) {
    logger.error('verifyOtp error:', error);
    return sendError(res, 'OTP verify अयशस्वी. पुन्हा प्रयत्न करा.', 500);
  }
};

// ── LOGIN WITH PASSWORD ───────────────────────────────────────
// New endpoint — mobile number + password login
const loginWithPassword = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return sendError(res, 'Mobile number आणि password आवश्यक आहे.', 400);
    }

    const user = await User.findOne({ phone }).select('+password');

    if (!user || user.name === 'Pending Registration') {
      return sendError(res, 'हा नंबर registered नाही. आधी नोंदणी करा.', 404);
    }
    if (!user.isActive) {
      return sendError(res, 'Account बंद केले आहे. Support ला संपर्क करा.', 403);
    }
    if (!user.password) {
      return sendError(res, 'Password set केलेला नाही. OTP ने login करा.', 400);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Password चुकीचा आहे. पुन्हा प्रयत्न करा.', 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const tokenPayload = { id: user._id, role: user.role, phone: user.phone };
    const accessToken  = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user._id });
    setTokenCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    const userWithProfile = await getUserWithProfile(user._id, user.role);

    return sendSuccess(res, 'Login यशस्वी! स्वागत आहे 🎉', {
      user:  userWithProfile,
      token: accessToken,
    });
  } catch (error) {
    logger.error('loginWithPassword error:', error);
    return sendError(res, 'Login अयशस्वी. पुन्हा प्रयत्न करा.', 500);
  }
};

// ── COMPLETE REGISTRATION ─────────────────────────────────────
const register = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name, role, language, password,
      dailyRate, city, district, state, pincode, experienceYrs, bio,
      companyName, employerType, gstNumber,
      latitude, longitude, address,
    } = req.body;

    if (!['worker', 'employer'].includes(role)) {
      return sendError(res, 'Role worker किंवा employer असावा.', 400);
    }
    if (!name || name.trim().length < 2) {
      return sendError(res, 'नाव किमान 2 अक्षरे असावे.', 400);
    }

    // Update basic user fields
    await User.findByIdAndUpdate(userId, {
      name:     name.trim(),
      role,
      language: language || 'mr',
    });

    // Save password if provided (must use .save() to trigger bcrypt hook)
    const trimmedPassword = password ? password.toString().trim() : '';
    if (trimmedPassword.length >= 6) {
      const userForPwd  = await User.findById(userId);
      userForPwd.password = trimmedPassword;
      await userForPwd.save(); // triggers pre-save bcrypt hash
    }

    // Profile photo upload
    let profilePhotoUrl = null;
    if (req.file) {
      profilePhotoUrl = await uploadToCloudinary(req.file.buffer, 'profiles', `user_${userId}`);
      await User.findByIdAndUpdate(userId, { profilePhoto: profilePhotoUrl });
    }

    const location = buildGeoPoint(latitude, longitude);
    const latNum   = latitude  ? parseFloat(latitude)  : null;
    const lngNum   = longitude ? parseFloat(longitude) : null;

    if (role === 'worker') {
      await Worker.findOneAndUpdate(
        { userId },
        {
          userId,
          dailyRate:     parseFloat(dailyRate),
          city,
          district,
          state:         state || 'Maharashtra',
          pincode,
          address,
          latitude:      latNum,
          longitude:     lngNum,
          location,
          experienceYrs: parseInt(experienceYrs) || 0,
          bio:           bio || '',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Save skills
      const skills = req.body.skills ? JSON.parse(req.body.skills) : [];
      if (skills.length > 0) {
        const worker = await Worker.findOne({ userId });
        if (worker) {
          await WorkerSkill.deleteMany({ workerId: worker._id });
          await WorkerSkill.insertMany(
            skills.map(s => ({
              workerId:    worker._id,
              categoryId:  s.categoryId,
              level:       s.level || 'experienced',
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
          companyName:  companyName || '',
          employerType: employerType || 'individual',
          gstNumber:    gstNumber || null,
          city,
          district,
          state:        state || 'Maharashtra',
          address,
          latitude:     latNum,
          longitude:    lngNum,
          location,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Issue permanent tokens
    const tokenPayload = { id: userId, role, phone: req.user.phone };
    const accessToken  = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: userId });
    setTokenCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    const user = await getUserWithProfile(userId, role);

    return sendSuccess(res, 'नोंदणी पूर्ण! Digital Kaam Naka मध्ये स्वागत आहे! 🎉', {
      user,
      token: accessToken,
    }, 201);
  } catch (error) {
    logger.error('register error:', error);
    return sendError(res, 'नोंदणी अयशस्वी. पुन्हा प्रयत्न करा.', 500, error.message);
  }
};

// ── LOGOUT ────────────────────────────────────────────────────
const logout = async (req, res) => {
  clearTokenCookie(res);
  res.clearCookie('refreshToken');
  return sendSuccess(res, 'Logout यशस्वी.');
};

// ── GET CURRENT USER ──────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await getUserWithProfile(req.user._id, req.user.role);
    if (!user) return sendError(res, 'User सापडला नाही.', 404);
    return sendSuccess(res, 'User profile मिळाला.', user);
  } catch (error) {
    logger.error('getMe error:', error);
    return sendError(res, 'Profile fetch अयशस्वी.', 500);
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return sendError(res, 'Refresh token नाही.', 401);

    const decoded = verifyToken(token, true);
    if (!decoded) return sendError(res, 'Invalid refresh token.', 401);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return sendError(res, 'User सापडला नाही.', 401);

    const newAccessToken  = generateAccessToken({ id: user._id, role: user.role, phone: user.phone });
    const newRefreshToken = generateRefreshToken({ id: user._id });
    setTokenCookie(res, newAccessToken);
    setRefreshCookie(res, newRefreshToken);

    return sendSuccess(res, 'Token refresh झाला.', { token: newAccessToken });
  } catch (error) {
    logger.error('refreshToken error:', error);
    return sendError(res, 'Token refresh अयशस्वी.', 500);
  }
};

module.exports = {
  checkUser,
  sendOtp,
  verifyOtp,
  loginWithPassword,
  register,
  logout,
  getMe,
  refreshToken,
};
/**
 * ================================================================
 * utils/tokenHelper.js — JWT Token Generation & Verification
 * Handles access tokens (7 days) and refresh tokens (30 days).
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * @desc    Generate JWT access token
 * @param   {Object} payload - { id, role, phone }
 * @returns {string} Signed JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    issuer: 'digitalkamnaka.in',
  });
};

/**
 * @desc    Generate JWT refresh token (longer lived)
 * @param   {Object} payload - { id }
 * @returns {string} Signed refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    issuer: 'digitalkamnaka.in',
  });
};

/**
 * @desc    Verify and decode JWT token
 * @param   {string} token - JWT token to verify
 * @param   {boolean} isRefresh - Whether this is a refresh token
 * @returns {Object|null} Decoded payload or null if invalid
 */
const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh
      ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
      : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    logger.warn('JWT verification failed:', error.message);
    return null;
  }
};

/**
 * @desc    Set JWT as httpOnly cookie on response
 * @param   {Object} res - Express response object
 * @param   {string} token - JWT access token
 */
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,          // always true — दोन्ही HTTPS आहेत
    sameSite: 'none',      // strict → none (cross-origin साठी)
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

/**
 * @desc    Clear JWT cookie on logout
 * @param   {Object} res - Express response object
 */
const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,          // हे पण बदला
    sameSite: 'none',      // हे पण बदला
    expires: new Date(0),s
  });
};

/**
 * @desc    Generate a 6-digit OTP
 * @returns {string} 6-digit OTP string
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Calculate OTP expiry timestamp
 * @param   {number} minutes - Minutes until expiry (default: 10)
 * @returns {Date} Expiry timestamp
 */
const getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};


module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  setTokenCookie,
  clearTokenCookie,
  generateOTP,
  getOtpExpiry,
};

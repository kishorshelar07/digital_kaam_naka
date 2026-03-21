/**
 * ================================================================
 * middleware/authMiddleware.js — JWT Authentication Middleware
 * Verifies JWT token from httpOnly cookie or Authorization header.
 * Attaches user object to req.user for use in controllers.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { verifyToken } = require('../utils/tokenHelper');
const { User } = require('../models');
const { sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @desc    Protect routes — require valid JWT
 * @usage   router.get('/protected', protect, controller)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check httpOnly cookie first (preferred, secure)
    if (req.cookies?.token) {
      token = req.cookies.token;
    }
    // Fallback: Authorization header (for mobile apps)
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Please login to access this resource', 401);
    }

    // Verify token and decode payload
    const decoded = verifyToken(token);
    if (!decoded) {
      return sendError(res, 'Token is invalid or expired. Please login again.', 401);
    }

    // Fetch fresh user from DB (ensures user still exists and is active)
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Contact support.', 403);
    }

    // Attach user to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    return sendError(res, 'Authentication failed', 401);
  }
};

/**
 * @desc    Optional auth — attach user if token present, continue if not
 * @usage   For routes that behave differently for logged-in users
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = await User.findByPk(decoded.id);
      }
    }
    next();
  } catch {
    next(); // Continue without auth
  }
};

module.exports = { protect, optionalAuth };

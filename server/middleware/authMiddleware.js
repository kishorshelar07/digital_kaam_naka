/**
 * ================================================================
 * middleware/authMiddleware.js — JWT Authentication Middleware
 * Converted from Sequelize → Mongoose
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { verifyToken } = require('../utils/tokenHelper');
const { User } = require('../models');
const { sendError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * @desc    Protect routes — require valid JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Please login to access this resource', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return sendError(res, 'Token is invalid or expired. Please login again.', 401);
    }

    // CHANGED: findByPk(id) → findById(id)
    const user = await User.findById(decoded.id);
    if (!user) return sendError(res, 'User no longer exists', 401);
    if (!user.isActive) return sendError(res, 'Your account has been deactivated. Contact support.', 403);

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error.message);
    return sendError(res, 'Authentication failed', 401);
  }
};

/**
 * @desc    Optional auth — attach user if token present, continue if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        // CHANGED: findByPk → findById
        req.user = await User.findById(decoded.id);
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = { protect, optionalAuth };

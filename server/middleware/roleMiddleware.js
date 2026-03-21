/**
 * middleware/roleMiddleware.js — Role-Based Access Control
 * Author: Digital Kaam Naka Dev Team
 */

const { sendError } = require('../utils/responseHelper');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Access denied. You do not have permission.', 403);
    }
    next();
  };
};

module.exports = { authorize };

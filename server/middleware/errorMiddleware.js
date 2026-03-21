/**
 * ================================================================
 * middleware/errorMiddleware.js — Global Error Handler
 * All unhandled errors land here. Returns standard error format.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const logger = require('../utils/logger');

/**
 * @desc    Handle 404 — route not found
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * @desc    Global error handler — catches all errors from next(err)
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';

  // Log error details (always in dev, only 500s in prod)
  if (process.env.NODE_ENV === 'development' || statusCode >= 500) {
    logger.error(`[${statusCode}] ${req.method} ${req.path} — ${message}`, {
      stack: err.stack,
      body: req.body,
    });
  }

  // ── Handle specific Sequelize errors ─────────────────────────
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(', ');
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = err.errors[0]?.path || 'field';
    message = `${field} already exists. Please use a different value.`;
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  }

  if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    message = process.env.NODE_ENV === 'production'
      ? 'Database error. Please try again.'
      : err.message;
  }

  // ── Handle JWT errors ─────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  // ── Handle Multer file upload errors ─────────────────────
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  // Send standardized error response
  const response = { success: false, message };
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err.message;
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };



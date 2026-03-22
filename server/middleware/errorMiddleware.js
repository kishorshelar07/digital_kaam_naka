/**
 * ================================================================
 * middleware/errorMiddleware.js — Global Error Handler
 * Converted from Sequelize → Mongoose error handling
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';

  if (process.env.NODE_ENV === 'development' || statusCode >= 500) {
    logger.error(`[${statusCode}] ${req.method} ${req.path} — ${message}`, {
      stack: err.stack,
      body: req.body,
    });
  }

  // ── Mongoose Validation Error ─────────────────────────────────
  // REPLACES: SequelizeValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // ── Mongoose Duplicate Key (unique index violation) ───────────
  // REPLACES: SequelizeUniqueConstraintError
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    message = `${field} '${value}' already exists. Please use a different value.`;
  }

  // ── Mongoose CastError (invalid ObjectId) ────────────────────
  // e.g. findById('not-a-valid-id') throws CastError
  // NO Sequelize equivalent — new error type specific to MongoDB
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // ── JWT errors ────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  // ── Multer errors ─────────────────────────────────────────────
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  const response = { success: false, message };
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err.message;
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };

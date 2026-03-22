/**
 * ================================================================
 * middleware/validateMiddleware.js — Joi Request Validation
 * Converted from Sequelize → Mongoose (MongoDB ObjectId support added)
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const Joi = require('joi');
const { sendError } = require('../utils/responseHelper');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return sendError(res, message, 400);
  }
  next();
};

// ── Custom ObjectId validator ──────────────────────────────────
// ADDED: Replaces Joi.number().integer().positive() for IDs
// MongoDB uses 24-char hex ObjectIds instead of auto-increment integers
const objectId = () =>
  Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .messages({ 'string.pattern.base': 'Invalid ID format' });

const schemas = {
  sendOtp: Joi.object({
    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({
        'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
        'any.required': 'Phone number is required',
      }),
  }),

  verifyOtp: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  setAvailability: Joi.object({
    isAvailable: Joi.boolean().required(),
    date: Joi.date().iso().required(),
    startTime: Joi.string().optional(),
    endTime: Joi.string().optional(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    radiusKm: Joi.number().min(1).max(200).default(20),
  }),

  createJob: Joi.object({
    // CHANGED: Joi.number().integer() → objectId()
    categoryId: objectId().required(),
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().max(2000).optional().allow(''),
    workersNeeded: Joi.number().integer().min(1).max(500).default(1),
    dailyRate: Joi.number().min(100).required(),
    jobDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().optional(),
    durationDays: Joi.number().integer().min(1).max(365).default(1),
    jobType: Joi.string().valid('daily', 'weekly', 'monthly').default('daily'),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().max(500).optional().allow(''),
    city: Joi.string().max(100).optional().allow(''),
    district: Joi.string().max(100).optional().allow(''),
    pincode: Joi.string().optional().allow(''),
    isUrgent: Joi.boolean().default(false),
    requirements: Joi.string().max(500).optional().allow(''),
  }),

  createBooking: Joi.object({
    // CHANGED: Joi.number().integer() → objectId()
    workerId: objectId().required(),
    jobPostId: objectId().optional(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().optional(),
    totalDays: Joi.number().integer().min(1).default(1),
    agreedRate: Joi.number().min(100).required(),
    bookingNote: Joi.string().max(500).optional().allow(''),
  }),

  submitRating: Joi.object({
    // CHANGED: Joi.number().integer() → objectId()
    bookingId: objectId().required(),
    score: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().max(1000).optional().allow(''),
  }),
};

const validators = Object.fromEntries(
  Object.entries(schemas).map(([key, schema]) => [key, validate(schema)])
);

module.exports = { validate, validators, schemas, objectId };

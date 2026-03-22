/**
 * ================================================================
 * models/index.js — Model Registry (MongoDB / Mongoose)
 * Converted from Sequelize (with associations) → Mongoose
 *
 * KEY DIFFERENCE FROM POSTGRESQL VERSION:
 * - No associations (hasOne, hasMany, belongsTo) needed here
 * - Relationships are handled via ObjectId refs + .populate() in queries
 * - No sequelize.sync() needed — Mongoose handles collections automatically
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const User         = require('./User');
const Worker       = require('./Worker');
const Employer     = require('./Employer');
const Category     = require('./Category');
const WorkerSkill  = require('./WorkerSkill');
const Availability = require('./Availability');
const JobPost      = require('./JobPost');
const Booking      = require('./Booking');
const Payment      = require('./Payment');
const Rating       = require('./Rating');
const Notification = require('./Notification');
const Subscription = require('./Subscription');

const { Location, Dispute } = require('./locationDisputeAdmin');

// ── AdminLog (inline — small model) ──────────────────────────
const AdminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: { type: String, required: true, maxlength: 200 },
    targetCollection: { type: String, default: null }, // replaces targetTable
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: String, default: null },
    ipAddress: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'admin_logs',
  }
);

AdminLogSchema.index({ adminId: 1 });
AdminLogSchema.index({ createdAt: -1 });

const AdminLog = mongoose.model('AdminLog', AdminLogSchema);

// ================================================================
// NOTE ON ASSOCIATIONS:
// In Mongoose, there are NO explicit association declarations.
// Relationships are defined via `ref` in each schema and resolved
// at query time using .populate().
//
// PostgreSQL equivalent → Mongoose equivalent:
//   include: [{ model: Worker, as: 'worker' }]
//   → .populate({ path: 'workerId', model: 'Worker' })
//
//   findByPk(id, { include: [Worker] })
//   → findById(id).populate('workerId')
// ================================================================

module.exports = {
  User,
  Worker,
  Employer,
  Category,
  WorkerSkill,
  Availability,
  JobPost,
  Booking,
  Payment,
  Rating,
  Notification,
  Subscription,
  Location,
  Dispute,
  AdminLog,
};

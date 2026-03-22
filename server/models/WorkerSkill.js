/**
 * ================================================================
 * models/WorkerSkill.js — Worker Skills Junction (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const WorkerSkillSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    level: {
      type: String,
      enum: ['beginner', 'experienced', 'expert'],
      default: 'beginner',
    },

    yearsInSkill: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'worker_skills',
  }
);

WorkerSkillSchema.index({ workerId: 1, categoryId: 1 });

module.exports = mongoose.model('WorkerSkill', WorkerSkillSchema);

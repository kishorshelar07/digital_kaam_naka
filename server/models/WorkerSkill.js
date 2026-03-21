/**
 * ================================================================
 * models/WorkerSkill.js — Worker Skills Junction Table (TABLE 5)
 * Links workers to categories with skill level indicators.
 * A worker can have multiple skills across different categories.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WorkerSkill = sequelize.define('WorkerSkill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  workerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'worker_id',
    references: { model: 'workers', key: 'id' },
    onDelete: 'CASCADE',
  },

  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: { model: 'categories', key: 'id' },
  },

  // Skill level affects worker's visibility in search rankings
  level: {
    type: DataTypes.ENUM('beginner', 'experienced', 'expert'),
    defaultValue: 'beginner',
  },

  // Years of experience in THIS specific skill
  yearsInSkill: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'years_in_skill',
  },
}, {
  tableName: 'worker_skills',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

module.exports = WorkerSkill;

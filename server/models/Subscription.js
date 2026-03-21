/**
 * ================================================================
 * models/Subscription.js — Employer Subscription Model (TABLE 12)
 * Razorpay subscription plans for employers to post jobs.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  employerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employer_id',
    references: { model: 'employers', key: 'id' },
  },

  plan: {
    type: DataTypes.ENUM('free', 'basic', 'pro', 'premium'),
    allowNull: false,
    // free: 3 posts/month | basic: ₹299 = 15 posts | pro: ₹799 = unlimited | premium: ₹1999 = unlimited + priority
  },

  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  postsAllowed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'posts_allowed',
    // -1 = unlimited
  },

  postsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'posts_used',
  },

  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },

  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date',
  },

  razorpaySubId: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'razorpay_sub_id',
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'subscriptions',
  timestamps: true,
  underscored: true,
});

/**
 * @desc    Check if employer can still post jobs
 * @returns {boolean}
 */
Subscription.prototype.canPost = function () {
  const now = new Date();
  const expired = new Date(this.endDate) < now;
  if (!this.isActive || expired) return false;
  if (this.postsAllowed === -1) return true; // unlimited
  return this.postsUsed < this.postsAllowed;
};

module.exports = Subscription;

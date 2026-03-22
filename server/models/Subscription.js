/**
 * ================================================================
 * models/Subscription.js — Employer Subscription Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },

    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'premium'],
      required: true,
      // free: 3 posts/month | basic: ₹299 = 15 posts | pro: ₹799 = unlimited | premium: ₹1999 = unlimited + priority
    },

    price: { type: Number, required: true },

    // -1 = unlimited
    postsAllowed: { type: Number, required: true },
    postsUsed: { type: Number, default: 0 },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    razorpaySubId: { type: String, default: null },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'subscriptions',
  }
);

SubscriptionSchema.index({ employerId: 1, isActive: 1 });

/**
 * Check if employer can still post jobs
 */
SubscriptionSchema.methods.canPost = function () {
  const now = new Date();
  if (!this.isActive || new Date(this.endDate) < now) return false;
  if (this.postsAllowed === -1) return true;
  return this.postsUsed < this.postsAllowed;
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);

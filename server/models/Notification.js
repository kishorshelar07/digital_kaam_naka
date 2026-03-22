/**
 * ================================================================
 * models/Notification.js — Notification Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        'booking_request', 'booking_accepted', 'booking_rejected',
        'booking_started', 'booking_completed', 'booking_cancelled',
        'payment_received', 'payment_pending', 'new_rating',
        'dispute_raised', 'dispute_resolved', 'verification_done',
        'urgent_job_nearby', 'system', 'promotion',
      ],
    },

    titleMr: { type: String, default: null },
    titleHi: { type: String, default: null },
    titleEn: { type: String, default: null },

    messageMr: { type: String, default: null },
    messageHi: { type: String, default: null },
    messageEn: { type: String, default: null },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceType: { type: String, default: null },

    channel: {
      type: String,
      enum: ['app', 'whatsapp', 'sms', 'email', 'push'],
      default: 'app',
    },

    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    isDelivered: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'notifications',
  }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ createdAt: -1 });

/**
 * Get notification in user's preferred language
 */
NotificationSchema.methods.getLocalized = function (lang = 'mr') {
  const langMap = {
    mr: { title: this.titleMr, message: this.messageMr },
    hi: { title: this.titleHi, message: this.messageHi },
    en: { title: this.titleEn, message: this.messageEn },
    gu: { title: this.titleEn, message: this.messageEn },
  };
  const localized = langMap[lang] || langMap.en;
  return {
    title: localized.title || this.titleEn,
    message: localized.message || this.messageEn,
  };
};

module.exports = mongoose.model('Notification', NotificationSchema);

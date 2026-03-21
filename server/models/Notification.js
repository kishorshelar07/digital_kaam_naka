/**
 * ================================================================
 * models/Notification.js — Notification Model (TABLE 11)
 * Stores all notifications in 3 languages. Sent via multiple
 * channels: app, WhatsApp, SMS, email, push (FCM).
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },

  type: {
    type: DataTypes.ENUM(
      'booking_request',    // Employer sent booking request to worker
      'booking_accepted',   // Worker accepted employer's request
      'booking_rejected',   // Worker rejected employer's request
      'booking_started',    // Worker started work
      'booking_completed',  // Work completed
      'booking_cancelled',  // Booking cancelled
      'payment_received',   // Worker received payment
      'payment_pending',    // Payment pending from employer
      'new_rating',         // Someone rated this user
      'dispute_raised',     // Dispute raised against user
      'dispute_resolved',   // Admin resolved dispute
      'verification_done',  // Admin verified worker's Aadhar
      'urgent_job_nearby',  // Urgent job posted near worker
      'system',             // System-wide announcement
      'promotion'           // Marketing/promotional message
    ),
    allowNull: false,
  },

  // Notification title in all 3 languages
  titleMr: { type: DataTypes.STRING(200), field: 'title_mr' },
  titleHi: { type: DataTypes.STRING(200), field: 'title_hi' },
  titleEn: { type: DataTypes.STRING(200), field: 'title_en' },

  // Full message in all 3 languages
  messageMr: { type: DataTypes.TEXT, field: 'message_mr' },
  messageHi: { type: DataTypes.TEXT, field: 'message_hi' },
  messageEn: { type: DataTypes.TEXT, field: 'message_en' },

  // What record this notification is about
  referenceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reference_id',
  },

  // What type of record (booking, payment, rating, etc.)
  referenceType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'reference_type',
  },

  // Which channel was used to send this notification
  channel: {
    type: DataTypes.ENUM('app', 'whatsapp', 'sms', 'email', 'push'),
    defaultValue: 'app',
  },

  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },

  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },

  // Whether the external notification (SMS/WhatsApp) was delivered
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_delivered',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  updatedAt: false,

  indexes: [
    { fields: ['user_id', 'is_read'] },
    { fields: ['user_id', 'type'] },
    { fields: ['created_at'] },
  ],
});

/**
 * @desc    Get notification title/message in user's preferred language
 * @param   {string} lang - Language code
 * @returns {Object} { title, message }
 */
Notification.prototype.getLocalized = function (lang = 'mr') {
  const langMap = {
    mr: { title: this.titleMr, message: this.messageMr },
    hi: { title: this.titleHi, message: this.messageHi },
    en: { title: this.titleEn, message: this.messageEn },
    gu: { title: this.titleEn, message: this.messageEn }, // Fallback to English
  };
  const localized = langMap[lang] || langMap.en;
  return {
    title: localized.title || this.titleEn,
    message: localized.message || this.messageEn,
  };
};

module.exports = Notification;

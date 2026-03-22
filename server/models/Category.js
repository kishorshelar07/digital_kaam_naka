/**
 * ================================================================
 * models/Category.js — Job Category Model (MongoDB / Mongoose)
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    nameEn: { type: String, required: true, trim: true },
    nameMr: { type: String, required: true, trim: true },
    nameHi: { type: String, required: true, trim: true },
    nameGu: { type: String, default: null, trim: true },

    iconUrl: { type: String, default: null },
    iconEmoji: { type: String, default: null },
    descriptionMr: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'categories',
  }
);

CategorySchema.index({ isActive: 1, sortOrder: 1 });

/**
 * Get category name based on user's language preference
 */
CategorySchema.methods.getName = function (lang = 'mr') {
  const nameMap = {
    mr: this.nameMr,
    hi: this.nameHi,
    en: this.nameEn,
    gu: this.nameGu || this.nameEn,
  };
  return nameMap[lang] || this.nameEn;
};

module.exports = mongoose.model('Category', CategorySchema);

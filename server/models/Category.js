/**
 * ================================================================
 * models/Category.js — Job Category Model (TABLE 4)
 * Stores all work categories in 3 languages (Marathi, Hindi, English).
 * Seeded with 12 initial categories matching Maharashtra's Naka system.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // Category name in all supported languages
  nameEn: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_en',
  },

  nameMr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_mr',
  },

  nameHi: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_hi',
  },

  nameGu: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'name_gu',
  },

  // Cloudinary URL for category icon (shown in category grid)
  iconUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'icon_url',
  },

  // Icon emoji fallback when image not loaded
  iconEmoji: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'icon_emoji',
  },

  descriptionMr: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_mr',
  },

  // Sort order for display in category grid
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  updatedAt: false, // Categories rarely update
});

/**
 * @desc    Get category name based on user's language preference
 * @param   {string} lang - Language code: 'mr', 'hi', 'en', 'gu'
 * @returns {string} Category name in requested language
 */
Category.prototype.getName = function (lang = 'mr') {
  const nameMap = {
    mr: this.nameMr,
    hi: this.nameHi,
    en: this.nameEn,
    gu: this.nameGu || this.nameEn,
  };
  return nameMap[lang] || this.nameEn;
};

module.exports = Category;

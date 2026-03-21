/**
 * models/locationDisputeAdmin.js
 * Location and Dispute models
 * Author: Digital Kaam Naka Dev Team
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// TABLE 13: locations
const Location = sequelize.define('Location', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  state:     { type: DataTypes.STRING(100), defaultValue: 'Maharashtra' },
  district:  { type: DataTypes.STRING(100), allowNull: false },
  taluka:    { type: DataTypes.STRING(100), allowNull: true },
  city:      { type: DataTypes.STRING(100), allowNull: true },
  pincode:   { type: DataTypes.STRING(10),  allowNull: true },
  latitude:  { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
  isActive:  { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, {
  tableName: 'locations',
  timestamps: false,
  underscored: true,
});

// TABLE 14: disputes
const Dispute = sequelize.define('Dispute', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookingId: {
    type: DataTypes.INTEGER, allowNull: false, field: 'booking_id',
    references: { model: 'bookings', key: 'id' },
  },
  raisedBy: {
    type: DataTypes.INTEGER, allowNull: false, field: 'raised_by',
    references: { model: 'users', key: 'id' },
  },
  against: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  reason:       { type: DataTypes.TEXT, allowNull: false },
  evidenceUrls: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [], field: 'evidence_urls' },
  status:       { type: DataTypes.ENUM('open', 'under_review', 'resolved', 'closed'), defaultValue: 'open' },
  resolution:   { type: DataTypes.TEXT, allowNull: true },
  resolvedBy:   { type: DataTypes.INTEGER, allowNull: true, field: 'resolved_by' },
  resolvedAt:   { type: DataTypes.DATE, allowNull: true, field: 'resolved_at' },
}, {
  tableName: 'disputes',
  timestamps: true,
  underscored: true,
});

module.exports = { Location, Dispute };

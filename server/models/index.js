/**
 * models/index.js — Model Registry and Associations
 * Author: Digital Kaam Naka Dev Team
 */

const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

// Import all models
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

// Location and Dispute from combined file
const locationDisputeModule = require('./locationDisputeAdmin');
const Location = locationDisputeModule.Location;
const Dispute  = locationDisputeModule.Dispute;

// AdminLog — define inline to avoid import issues
const AdminLog = sequelize.define('AdminLog', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  adminId:     { type: DataTypes.INTEGER, allowNull: false, field: 'admin_id' },
  action:      { type: DataTypes.STRING(200), allowNull: false },
  targetTable: { type: DataTypes.STRING(100), allowNull: true, field: 'target_table' },
  targetId:    { type: DataTypes.INTEGER, allowNull: true, field: 'target_id' },
  details:     { type: DataTypes.TEXT, allowNull: true },
  ipAddress:   { type: DataTypes.STRING(50), allowNull: true, field: 'ip_address' },
}, { tableName: 'admin_logs', timestamps: true, underscored: true, updatedAt: false });

// ================================================================
// ASSOCIATIONS
// ================================================================

// User <-> Worker
User.hasOne(Worker,   { foreignKey: 'userId', as: 'workerProfile' });
Worker.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Employer
User.hasOne(Employer,   { foreignKey: 'userId', as: 'employerProfile' });
Employer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Worker <-> Skills
Worker.hasMany(WorkerSkill,    { foreignKey: 'workerId', as: 'skills' });
WorkerSkill.belongsTo(Worker,  { foreignKey: 'workerId', as: 'worker' });
WorkerSkill.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(WorkerSkill,  { foreignKey: 'categoryId', as: 'workerSkills' });

// Worker <-> Availability
Worker.hasMany(Availability,     { foreignKey: 'workerId', as: 'availabilitySchedule' });
Availability.belongsTo(Worker,   { foreignKey: 'workerId', as: 'worker' });

// Employer <-> JobPost
Employer.hasMany(JobPost,  { foreignKey: 'employerId', as: 'jobPosts' });
JobPost.belongsTo(Employer, { foreignKey: 'employerId', as: 'employer' });

// Category <-> JobPost
Category.hasMany(JobPost, { foreignKey: 'categoryId', as: 'jobs' });
JobPost.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// JobPost <-> Booking
JobPost.hasMany(Booking,  { foreignKey: 'jobPostId', as: 'bookings' });
Booking.belongsTo(JobPost, { foreignKey: 'jobPostId', as: 'jobPost' });

// Worker <-> Booking
Worker.hasMany(Booking,  { foreignKey: 'workerId', as: 'bookings' });
Booking.belongsTo(Worker, { foreignKey: 'workerId', as: 'worker' });

// Employer <-> Booking
Employer.hasMany(Booking,  { foreignKey: 'employerId', as: 'bookings' });
Booking.belongsTo(Employer, { foreignKey: 'employerId', as: 'employer' });

// Booking <-> Payment
Booking.hasOne(Payment,   { foreignKey: 'bookingId', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// Worker <-> Payment
Worker.hasMany(Payment,  { foreignKey: 'workerId', as: 'payments' });
Payment.belongsTo(Worker, { foreignKey: 'workerId', as: 'worker' });

// Employer <-> Payment
Employer.hasMany(Payment,  { foreignKey: 'employerId', as: 'payments' });
Payment.belongsTo(Employer, { foreignKey: 'employerId', as: 'employer' });

// Booking <-> Rating
Booking.hasMany(Rating,  { foreignKey: 'bookingId', as: 'ratings' });
Rating.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// User <-> Rating
User.hasMany(Rating, { foreignKey: 'ratedBy', as: 'ratingsGiven' });
User.hasMany(Rating, { foreignKey: 'ratedTo', as: 'ratingsReceived' });
Rating.belongsTo(User, { foreignKey: 'ratedBy', as: 'rater' });
Rating.belongsTo(User, { foreignKey: 'ratedTo', as: 'ratee' });

// User <-> Notification
User.hasMany(Notification,     { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User,   { foreignKey: 'userId', as: 'user' });

// Employer <-> Subscription
Employer.hasMany(Subscription,   { foreignKey: 'employerId', as: 'subscriptions' });
Subscription.belongsTo(Employer, { foreignKey: 'employerId', as: 'employer' });

// User <-> Dispute
User.hasMany(Dispute, { foreignKey: 'raisedBy', as: 'disputesRaised' });
User.hasMany(Dispute, { foreignKey: 'against',  as: 'disputesAgainst' });
Dispute.belongsTo(User, { foreignKey: 'raisedBy', as: 'raisedByUser' });
Dispute.belongsTo(User, { foreignKey: 'against',  as: 'againstUser' });
Booking.hasMany(Dispute,  { foreignKey: 'bookingId', as: 'disputes' });
Dispute.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// AdminLog <-> User
User.hasMany(AdminLog,   { foreignKey: 'adminId', as: 'adminLogs' });
AdminLog.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

// Booking cancelled by User
User.hasMany(Booking,    { foreignKey: 'cancelledBy', as: 'cancelledBookings' });
Booking.belongsTo(User,  { foreignKey: 'cancelledBy', as: 'cancelledByUser' });

// Dispute resolved by admin
User.hasMany(Dispute,   { foreignKey: 'resolvedBy', as: 'resolvedDisputes' });
Dispute.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolvedByAdmin' });

// Worker <-> Category (many-to-many through WorkerSkill)
Worker.belongsToMany(Category, {
  through: WorkerSkill,
  foreignKey: 'workerId',
  otherKey: 'categoryId',
  as: 'categories',
});
Category.belongsToMany(Worker, {
  through: WorkerSkill,
  foreignKey: 'categoryId',
  otherKey: 'workerId',
  as: 'workers',
});

module.exports = {
  sequelize,
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

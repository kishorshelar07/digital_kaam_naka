/**
 * ================================================================
 * config/socket.js — Socket.IO Real-Time Event Handler
 * Manages all real-time communication: booking notifications,
 * worker availability updates, live location tracking.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { Server } = require('socket.io');
const { verifyToken } = require('../utils/tokenHelper');
const { User } = require('../models');
const logger = require('../utils/logger');

// In-memory map of userId → socketId (for targeted events)
// TODO: Replace with Redis for multi-server deployments
const onlineUsers = new Map();

/**
 * @desc    Initialize Socket.IO server and register all event handlers
 * @param   {http.Server} httpServer - Express HTTP server instance
 * @returns {Server} Configured Socket.IO instance
 */
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Ping timeout — disconnect idle connections after 60s
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Authentication middleware for Socket.IO ────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid or expired token'));
      }

      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch (error) {
      logger.error('Socket auth error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // ── Connection handler ─────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`🔌 Socket connected: User ${userId} (${socket.userRole})`);

    // Track online user
    onlineUsers.set(userId, socket.id);

    // Join personal room for targeted notifications
    socket.join(`user:${userId}`);

    // ── CLIENT EVENTS (what clients send to server) ──────────

    /**
     * Worker marks themselves available/unavailable
     * Broadcasts updated status to all connected employers
     */
    socket.on('worker_online', (data) => {
      logger.info(`Worker ${userId} marked available`);
      socket.broadcast.emit('worker_status_updated', {
        workerId: data.workerId,
        isAvailable: true,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    });

    socket.on('worker_offline', (data) => {
      logger.info(`Worker ${userId} marked unavailable`);
      socket.broadcast.emit('worker_status_updated', {
        workerId: data.workerId,
        isAvailable: false,
      });
    });

    /**
     * Worker shares real-time location (while job is active)
     */
    socket.on('location_update', (data) => {
      // Only forward to the specific employer who booked this worker
      if (data.employerUserId) {
        io.to(`user:${data.employerUserId}`).emit('worker_location', {
          workerId: data.workerId,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date(),
        });
      }
    });

    /**
     * User explicitly joins a booking-specific room
     * Both parties can track booking events in real-time
     */
    socket.on('join_booking_room', (bookingId) => {
      socket.join(`booking:${bookingId}`);
      logger.info(`User ${userId} joined booking room ${bookingId}`);
    });

    socket.on('leave_booking_room', (bookingId) => {
      socket.leave(`booking:${bookingId}`);
    });

    // ── DISCONNECT ────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      onlineUsers.delete(userId);
      logger.info(`🔌 Socket disconnected: User ${userId} (${reason})`);

      // If worker disconnects, mark them offline in broadcasts
      if (socket.userRole === 'worker') {
        socket.broadcast.emit('worker_status_updated', {
          userId,
          isAvailable: false,
        });
      }
    });
  });

  return io;
};

// ── SERVER-SIDE EMIT HELPERS ─────────────────────────────────
// These are called from controllers to push events to specific users

/**
 * @desc    Emit an event to a specific user's room
 * @param   {Server} io     - Socket.IO server instance
 * @param   {number} userId - Target user's ID
 * @param   {string} event  - Event name
 * @param   {Object} data   - Event payload
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
  logger.info(`📡 Emitted '${event}' to user ${userId}`);
};

/**
 * @desc    Emit to all users in a booking room
 */
const emitToBooking = (io, bookingId, event, data) => {
  io.to(`booking:${bookingId}`).emit(event, data);
};

/**
 * @desc    Broadcast booking request notification to worker
 */
const notifyNewBookingRequest = (io, workerUserId, bookingData) => {
  emitToUser(io, workerUserId, 'new_booking_request', {
    type: 'new_booking_request',
    ...bookingData,
    timestamp: new Date(),
  });
};

/**
 * @desc    Notify employer that worker accepted their booking
 */
const notifyBookingAccepted = (io, employerUserId, bookingData) => {
  emitToUser(io, employerUserId, 'booking_accepted', {
    type: 'booking_accepted',
    ...bookingData,
    timestamp: new Date(),
  });
};

/**
 * @desc    Notify employer that worker rejected their booking
 */
const notifyBookingRejected = (io, employerUserId, bookingData) => {
  emitToUser(io, employerUserId, 'booking_rejected', {
    type: 'booking_rejected',
    ...bookingData,
    timestamp: new Date(),
  });
};

/**
 * @desc    Notify employer that worker has started work
 */
const notifyWorkStarted = (io, employerUserId, bookingData) => {
  emitToUser(io, employerUserId, 'work_started', {
    type: 'work_started',
    ...bookingData,
    timestamp: new Date(),
  });
};

/**
 * @desc    Notify both parties that work is complete
 */
const notifyWorkCompleted = (io, workerUserId, employerUserId, bookingData) => {
  emitToUser(io, workerUserId, 'work_completed', { type: 'work_completed', ...bookingData });
  emitToUser(io, employerUserId, 'work_completed', { type: 'work_completed', ...bookingData });
};

/**
 * @desc    Notify worker that payment has been received
 */
const notifyPaymentReceived = (io, workerUserId, paymentData) => {
  emitToUser(io, workerUserId, 'payment_received', {
    type: 'payment_received',
    ...paymentData,
    timestamp: new Date(),
  });
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitToBooking,
  notifyNewBookingRequest,
  notifyBookingAccepted,
  notifyBookingRejected,
  notifyWorkStarted,
  notifyWorkCompleted,
  notifyPaymentReceived,
  onlineUsers,
};

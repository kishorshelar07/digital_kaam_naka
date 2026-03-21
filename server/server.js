/**
 * ================================================================
 * server.js — Application Entry Point
 * Sets up Express + Socket.IO, applies all middleware,
 * connects to DB, and starts listening for requests.
 *
 * Author: Digital Kaam Naka Dev Team
 * Platform: Digital Kaam Naka — digitalkamnaka.in
 * Mission: Digitizing Maharashtra's Naka System
 * ================================================================
 */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { initializeSocket } = require('./config/socket');
const apiRoutes = require('./routes/index');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

// ── Initialize Express app ────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ── Security Middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow Cloudinary images
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://*.tile.openstreetmap.org'],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      frameSrc: ["'self'", 'https://api.razorpay.com'],
    },
  },
}));

// ── CORS Configuration ────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,           // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Request Logging ───────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── Global Rate Limiting ──────────────────────────────────────
// 100 requests per minute per IP for general routes
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // Skip in dev
});
app.use('/api', generalLimiter);

// ── API Routes ────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Root endpoint ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏗️ Digital Kaam Naka API — Ghari Basa, Kaam Mila!',
    docs: '/api/health',
    version: '1.0.0',
  });
});

// ── 404 & Global Error Handler ────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Initialize Socket.IO ──────────────────────────────────────
const io = initializeSocket(httpServer);
// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// ── Start Server ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // Connect to PostgreSQL + sync models
    await connectDB();

    httpServer.listen(PORT, () => {
      logger.info('================================================');
      logger.info(`🚀 Digital Kaam Naka Server Started`);
      logger.info(`🌐 API:    http://localhost:${PORT}/api`);
      logger.info(`🔌 Socket: ws://localhost:${PORT}`);
      logger.info(`🌍 Env:    ${process.env.NODE_ENV || 'development'}`);
      logger.info('================================================');
    });
  } catch (error) {
    logger.error('Fatal: Server failed to start:', error.message);
    process.exit(1);
  }
};

// ── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
  // Don't crash in production — just log it
  if (process.env.NODE_ENV !== 'production') process.exit(1);
});

startServer();

module.exports = { app, io };
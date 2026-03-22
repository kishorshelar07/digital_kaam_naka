/**
 * ================================================================
 * server.js — Application Entry Point
 * Converted from Sequelize PostgreSQL → Mongoose MongoDB
 *
 * CHANGES FROM PostgreSQL VERSION:
 *  - connectDB() now connects to MongoDB via Mongoose
 *  - No sequelize.sync() call needed (Mongoose handles collections)
 *  - Graceful shutdown now also closes mongoose connection
 *
 * Author: Digital Kaam Naka Dev Team
 * Platform: Digital Kaam Naka — digitalkamnaka.in
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
// CHANGED: mongoose imported here for graceful shutdown
const mongoose = require('mongoose');

const { connectDB } = require('./config/db');
const { initializeSocket } = require('./config/socket');
const apiRoutes = require('./routes/index');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

// ── Initialize Express ────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ── Security Middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://*.tile.openstreetmap.org'],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      frameSrc: ["'self'", 'https://api.razorpay.com'],
    },
  },
}));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      'https://digital-kaam-naka.vercel.app',
      process.env.CLIENT_URL,
    ].filter(Boolean);

    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
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

// ── Rate Limiting ─────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api', generalLimiter);

// ── API Routes ────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Root Endpoint ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏗️ Digital Kaam Naka API — Ghari Basa, Kaam Mila!',
    db: 'MongoDB',
    version: '2.0.0',
  });
});

// ── Error Handlers ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Socket.IO ─────────────────────────────────────────────────
const io = initializeSocket(httpServer);
app.set('io', io);

// ── Start Server ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // CHANGED: connects to MongoDB (not PostgreSQL)
    // No sequelize.sync() needed — Mongoose handles collections automatically
    await connectDB();

    httpServer.listen(PORT, () => {
      logger.info('================================================');
      logger.info('🚀 Digital Kaam Naka Server Started (MongoDB)');
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
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(async () => {
    // CHANGED: also close mongoose connection on shutdown
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
  if (process.env.NODE_ENV !== 'production') process.exit(1);
});

startServer();

module.exports = { app, io };

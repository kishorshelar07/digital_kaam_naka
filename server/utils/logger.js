/**
 * ================================================================
 * utils/logger.js — Application Logger
 * Replaces console.log with structured logging.
 * In production, logs to files. In dev, logs to console.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format: [2024-01-15 09:30:00] INFO: message
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // log stack traces
    logFormat
  ),
  transports: [
    // Always log to console (colorized in dev)
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
});

// In production, also write to log files
if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new transports.File({ filename: 'logs/combined.log' }));
}

module.exports = logger;

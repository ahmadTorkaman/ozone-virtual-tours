// ===========================================
// Structured Logger
// ===========================================
// Winston-based logger with JSON output for production

import winston from 'winston';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Determine log level from environment
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Custom format for development (readable)
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

// Create the logger
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' })
  ),
  defaultMeta: { service: 'ozone-tours' },
  transports: []
});

// Add console transport with format based on environment
if (process.env.NODE_ENV === 'production') {
  // JSON format for production (easy to parse by log aggregators)
  logger.add(new winston.transports.Console({
    format: combine(
      timestamp(),
      json()
    )
  }));
} else {
  // Colorized readable format for development
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss.SSS' }),
      devFormat
    )
  }));
}

// Add file transport for errors in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: process.env.LOG_DIR ? `${process.env.LOG_DIR}/error.log` : './logs/error.log',
    level: 'error',
    format: combine(timestamp(), json()),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: process.env.LOG_DIR ? `${process.env.LOG_DIR}/combined.log` : './logs/combined.log',
    format: combine(timestamp(), json()),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }));
}

// Helper methods for common logging patterns
export const logRequest = (req, res, duration) => {
  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

  logger.log(level, 'HTTP Request', {
    method: req.method,
    path: req.originalUrl || req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id
  });
};

export const logError = (error, req = null) => {
  const meta = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  if (req) {
    meta.method = req.method;
    meta.path = req.originalUrl || req.url;
    meta.userId = req.user?.id;
  }

  logger.error('Application Error', meta);
};

export const logAuth = (action, userId, success, details = {}) => {
  const level = success ? 'info' : 'warn';
  logger.log(level, `Auth: ${action}`, {
    userId,
    success,
    ...details
  });
};

export const logUpload = (type, filename, size, userId, success) => {
  const level = success ? 'info' : 'warn';
  logger.log(level, `Upload: ${type}`, {
    filename,
    size,
    userId,
    success
  });
};

export default logger;

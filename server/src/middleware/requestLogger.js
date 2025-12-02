// ===========================================
// Request Logger Middleware
// ===========================================
// Logs all HTTP requests with timing

import { logRequest } from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs method, path, status, and duration for all requests
 */
export const requestLogger = (req, res, next) => {
  // Skip logging for health checks and static files
  if (req.path === '/health' || req.path.startsWith('/uploads/')) {
    return next();
  }

  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res, duration);
  });

  next();
};

export default requestLogger;

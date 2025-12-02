// ===========================================
// Rate Limiter Middleware
// ===========================================
// Protects API endpoints from abuse

import rateLimit from 'express-rate-limit';

// ===========================================
// Rate Limit Configurations
// ===========================================

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: {
      message: 'Too many requests, please try again later.',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if behind proxy, otherwise use IP
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  }
});

/**
 * Authentication rate limiter (stricter)
 * 5 requests per minute per IP
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: {
      message: 'Too many login attempts, please try again later.',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  },
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Upload rate limiter
 * 10 uploads per minute per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: {
      message: 'Too many uploads, please try again later.',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  }
});

/**
 * Public tour access rate limiter (generous)
 * 200 requests per minute per IP
 */
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: {
    error: {
      message: 'Too many requests, please try again later.',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  }
});

export default {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  publicLimiter
};

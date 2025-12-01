// ===========================================
// Authentication Middleware
// ===========================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to check if user is authenticated
 * Looks for session token in cookies or Authorization header
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from cookie or header
    const token = req.cookies?.sessionToken ||
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: { message: 'Authentication required' }
      });
    }

    // Find valid session
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session) {
      return res.status(401).json({
        error: { message: 'Invalid session' }
      });
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({
        error: { message: 'Session expired' }
      });
    }

    // Attach user to request
    req.user = session.user;
    req.sessionId = session.id;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: { message: 'Authentication error' }
    });
  }
};

/**
 * Middleware to check if user has admin role
 * Must be used after requireAuth
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Authentication required' }
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: { message: 'Admin access required' }
    });
  }

  next();
};

/**
 * Optional auth - attaches user if authenticated, but doesn't require it
 * Useful for public routes that behave differently for authenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.sessionToken ||
                  req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });

      if (session && new Date() <= session.expiresAt) {
        req.user = session.user;
        req.sessionId = session.id;
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

export default { requireAuth, requireAdmin, optionalAuth };

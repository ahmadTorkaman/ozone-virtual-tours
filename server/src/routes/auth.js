// ===========================================
// Authentication Routes
// ===========================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAuth } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
// Invite link duration: 7 days
const INVITE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate a secure random token
 */
const generateToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Create a session for a user
 */
const createSession = async (userId) => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return { token, expiresAt };
};

// ===========================================
// GET /api/auth/me - Get current user
// ===========================================
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: { message: 'Failed to get user' } });
  }
});

// ===========================================
// POST /api/auth/login - Login with email
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: { message: 'Email is required' }
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      logAuth('login', null, false, { email, reason: 'user_not_found' });
      return res.status(401).json({
        error: { message: 'No account found with this email. Please use an invite link to register.' }
      });
    }

    // Create session
    const { token, expiresAt } = await createSession(user.id);

    // Set cookie
    res.cookie('sessionToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS
    });

    logAuth('login', user.id, true, { email: user.email });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      token,
      expiresAt
    });
  } catch (error) {
    logAuth('login', null, false, { error: error.message });
    res.status(500).json({ error: { message: 'Login failed' } });
  }
});

// ===========================================
// POST /api/auth/logout - Logout
// ===========================================
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Delete session
    await prisma.session.delete({
      where: { id: req.sessionId }
    });

    // Clear cookie
    res.clearCookie('sessionToken');

    logAuth('logout', req.user.id, true);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logAuth('logout', req.user?.id, false, { error: error.message });
    res.status(500).json({ error: { message: 'Logout failed' } });
  }
});

// ===========================================
// POST /api/auth/invite - Generate invite link
// ===========================================
router.post('/invite', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;

    // Generate invite token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + INVITE_DURATION_MS);

    const invite = await prisma.inviteLink.create({
      data: {
        token,
        email: email?.toLowerCase() || null,
        createdById: req.user.id,
        expiresAt
      }
    });

    const inviteUrl = `${process.env.BASE_URL || 'http://localhost:5173'}/register/${token}`;

    logAuth('invite_created', req.user.id, true, { invitedEmail: email || 'any' });

    res.status(201).json({
      invite: {
        id: invite.id,
        token: invite.token,
        email: invite.email,
        expiresAt: invite.expiresAt,
        url: inviteUrl
      }
    });
  } catch (error) {
    logAuth('invite_created', req.user?.id, false, { error: error.message });
    res.status(500).json({ error: { message: 'Failed to create invite' } });
  }
});

// ===========================================
// GET /api/auth/invite/:token - Validate invite
// ===========================================
router.get('/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invite = await prisma.inviteLink.findUnique({
      where: { token }
    });

    if (!invite) {
      return res.status(404).json({
        error: { message: 'Invalid invite link' }
      });
    }

    if (invite.usedAt) {
      return res.status(400).json({
        error: { message: 'This invite link has already been used' }
      });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({
        error: { message: 'This invite link has expired' }
      });
    }

    res.json({
      valid: true,
      email: invite.email
    });
  } catch (error) {
    console.error('Validate invite error:', error);
    res.status(500).json({ error: { message: 'Failed to validate invite' } });
  }
});

// ===========================================
// POST /api/auth/register - Register with invite
// ===========================================
router.post('/register', async (req, res) => {
  try {
    const { token, email, name } = req.body;

    if (!token || !email || !name) {
      return res.status(400).json({
        error: { message: 'Token, email, and name are required' }
      });
    }

    // Validate invite
    const invite = await prisma.inviteLink.findUnique({
      where: { token }
    });

    if (!invite) {
      return res.status(404).json({
        error: { message: 'Invalid invite link' }
      });
    }

    if (invite.usedAt) {
      return res.status(400).json({
        error: { message: 'This invite link has already been used' }
      });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({
        error: { message: 'This invite link has expired' }
      });
    }

    // Check if email matches (if invite was for specific email)
    if (invite.email && invite.email !== email.toLowerCase()) {
      return res.status(400).json({
        error: { message: 'Email does not match the invite' }
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        error: { message: 'An account with this email already exists' }
      });
    }

    // Determine role - first user is admin
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'EDITOR';

    // Create user and mark invite as used in a transaction
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          role,
          invitedBy: invite.createdById
        }
      }),
      prisma.inviteLink.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
          usedById: email.toLowerCase()
        }
      })
    ]);

    // Create session
    const session = await createSession(user.id);

    // Set cookie
    res.cookie('sessionToken', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS
    });

    logAuth('register', user.id, true, { email: user.email, role });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    logAuth('register', null, false, { error: error.message });
    res.status(500).json({ error: { message: 'Registration failed' } });
  }
});

// ===========================================
// GET /api/auth/invites - List all invites (admin)
// ===========================================
router.get('/invites', requireAuth, async (req, res) => {
  try {
    const invites = await prisma.inviteLink.findMany({
      where: {
        createdById: req.user.id
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invites });
  } catch (error) {
    console.error('List invites error:', error);
    res.status(500).json({ error: { message: 'Failed to list invites' } });
  }
});

// ===========================================
// DELETE /api/auth/invite/:id - Revoke invite
// ===========================================
router.delete('/invite/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const invite = await prisma.inviteLink.findUnique({
      where: { id }
    });

    if (!invite) {
      return res.status(404).json({
        error: { message: 'Invite not found' }
      });
    }

    // Only creator or admin can revoke
    if (invite.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: { message: 'Not authorized to revoke this invite' }
      });
    }

    await prisma.inviteLink.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Revoke invite error:', error);
    res.status(500).json({ error: { message: 'Failed to revoke invite' } });
  }
});

// ===========================================
// GET /api/auth/bootstrap - Check if first user setup needed
// ===========================================
router.get('/bootstrap', async (req, res) => {
  try {
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      // Generate a bootstrap invite for the first user
      const token = generateToken();
      const expiresAt = new Date(Date.now() + INVITE_DURATION_MS);

      // Check if bootstrap invite already exists
      let bootstrapInvite = await prisma.inviteLink.findFirst({
        where: {
          createdById: 'SYSTEM',
          usedAt: null,
          expiresAt: { gt: new Date() }
        }
      });

      if (!bootstrapInvite) {
        // Create a system user placeholder for bootstrap
        bootstrapInvite = await prisma.inviteLink.create({
          data: {
            token,
            createdById: 'SYSTEM', // Special marker for bootstrap
            expiresAt
          }
        });
      }

      return res.json({
        needsBootstrap: true,
        inviteToken: bootstrapInvite.token
      });
    }

    res.json({ needsBootstrap: false });
  } catch (error) {
    console.error('Bootstrap check error:', error);
    res.status(500).json({ error: { message: 'Bootstrap check failed' } });
  }
});

export default router;

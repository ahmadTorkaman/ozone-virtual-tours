// ===========================================
// Settings Routes (Branding & Team)
// ===========================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ===========================================
// BRANDING SETTINGS
// ===========================================

// GET /api/settings/branding - Get branding settings (public)
router.get('/branding', async (req, res) => {
  try {
    let branding = await prisma.brandingSettings.findFirst();

    // Create default branding if none exists
    if (!branding) {
      branding = await prisma.brandingSettings.create({
        data: {
          companyName: 'Company Name',
          primaryColor: '#7c8cfb',
          secondaryColor: '#9b72f2',
          poweredByText: 'powered by Ozone'
        }
      });
    }

    res.json({ branding });
  } catch (error) {
    console.error('Get branding error:', error);
    res.status(500).json({ error: { message: 'Failed to get branding settings' } });
  }
});

// PUT /api/settings/branding - Update branding settings
router.put('/branding', requireAuth, async (req, res) => {
  try {
    const { companyName, companyLogo, primaryColor, secondaryColor, poweredByText } = req.body;

    let branding = await prisma.brandingSettings.findFirst();

    if (branding) {
      branding = await prisma.brandingSettings.update({
        where: { id: branding.id },
        data: {
          ...(companyName !== undefined && { companyName }),
          ...(companyLogo !== undefined && { companyLogo }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...(poweredByText !== undefined && { poweredByText })
        }
      });
    } else {
      branding = await prisma.brandingSettings.create({
        data: {
          companyName: companyName || 'Company Name',
          companyLogo,
          primaryColor: primaryColor || '#7c8cfb',
          secondaryColor: secondaryColor || '#9b72f2',
          poweredByText: poweredByText || 'powered by Ozone'
        }
      });
    }

    res.json({ branding });
  } catch (error) {
    console.error('Update branding error:', error);
    res.status(500).json({ error: { message: 'Failed to update branding settings' } });
  }
});

// ===========================================
// TEAM MANAGEMENT
// ===========================================

// GET /api/settings/team - Get team members
router.get('/team', requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: { message: 'Failed to get team members' } });
  }
});

// PUT /api/settings/team/:id - Update team member (admin only)
router.put('/team/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    // Prevent changing own role
    if (id === req.user.id && role && role !== req.user.role) {
      return res.status(400).json({
        error: { message: 'Cannot change your own role' }
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    console.error('Update team member error:', error);
    res.status(500).json({ error: { message: 'Failed to update team member' } });
  }
});

// DELETE /api/settings/team/:id - Remove team member (admin only)
router.delete('/team/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({
        error: { message: 'Cannot remove yourself from the team' }
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Delete user's sessions first, then user
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    res.status(204).send();
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: { message: 'Failed to remove team member' } });
  }
});

// GET /api/settings/team/stats - Get team statistics
router.get('/team/stats', requireAuth, async (req, res) => {
  try {
    const [userCount, tourCount, publishedCount] = await Promise.all([
      prisma.user.count(),
      prisma.tour.count(),
      prisma.tour.count({ where: { isPublished: true } })
    ]);

    res.json({
      stats: {
        teamMembers: userCount,
        totalTours: tourCount,
        publishedTours: publishedCount
      }
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({ error: { message: 'Failed to get team statistics' } });
  }
});

export default router;

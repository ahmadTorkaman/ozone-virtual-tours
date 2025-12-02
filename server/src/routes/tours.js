// ===========================================
// Tours Routes
// ===========================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Generate a URL-safe slug from a string
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Ensure slug is unique by appending a number if needed
 */
async function ensureUniqueSlug(slug, excludeId = null) {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const existing = await prisma.tour.findUnique({
      where: { slug: uniqueSlug },
      select: { id: true }
    });

    if (!existing || existing.id === excludeId) {
      return uniqueSlug;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}

// ===========================================
// GET /api/tours - List all tours
// ===========================================
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { published, projectRef, limit } = req.query;

    const where = { isArchived: false };

    // If not authenticated, only show published tours
    if (!req.user) {
      where.isPublished = true;
    } else if (published === 'true') {
      where.isPublished = true;
    }

    if (projectRef) where.projectRef = projectRef;

    const tours = await prisma.tour.findMany({
      where,
      include: {
        scenes: {
          select: { id: true, name: true, thumbnailUrl: true, order: true },
          orderBy: { order: 'asc' }
        },
        _count: { select: { scenes: true, floorPlans: true } }
      },
      orderBy: { updatedAt: 'desc' },
      ...(limit && { take: parseInt(limit) })
    });

    res.json({ tours });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// GET /api/tours/slug/:slug - Get tour by slug (public)
// ===========================================
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const tour = await prisma.tour.findUnique({
      where: { slug },
      include: {
        scenes: {
          include: { hotspots: true },
          orderBy: { order: 'asc' }
        },
        floorPlans: {
          orderBy: { floor: 'asc' }
        }
      }
    });

    if (!tour) {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }

    // Check if tour is published
    if (!tour.isPublished) {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }

    // If password protected, return minimal info
    if (tour.isPasswordProtected && tour.password) {
      return res.json({
        needsPassword: true,
        tour: {
          id: tour.id,
          name: tour.name,
          slug: tour.slug
        }
      });
    }

    // Remove password from response
    const { password, ...tourWithoutPassword } = tour;

    res.json({ tour: tourWithoutPassword });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/tours/:id/verify-password - Verify tour password
// ===========================================
router.post('/:id/verify-password', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: { message: 'Password is required' } });
    }

    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        scenes: {
          include: { hotspots: true },
          orderBy: { order: 'asc' }
        },
        floorPlans: {
          orderBy: { floor: 'asc' }
        }
      }
    });

    if (!tour) {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, tour.password);

    if (!isValid) {
      return res.status(401).json({ error: { message: 'Incorrect password' } });
    }

    // Remove password from response
    const { password: _, ...tourWithoutPassword } = tour;

    res.json({ tour: tourWithoutPassword });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// GET /api/tours/:id - Get single tour with all details
// ===========================================
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        scenes: {
          include: { hotspots: true },
          orderBy: { order: 'asc' }
        },
        floorPlans: {
          orderBy: { floor: 'asc' }
        }
      }
    });

    if (!tour) {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }

    // Remove password from response
    const { password, ...tourWithoutPassword } = tour;

    res.json({ tour: tourWithoutPassword });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/tours - Create new tour
// ===========================================
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      name,
      slug: customSlug,
      description,
      clientName,
      projectRef,
      isPasswordProtected,
      password,
      ambientMusicUrl,
      ambientMusicVolume,
      settings
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: { message: 'Name is required' } });
    }

    // Generate or validate slug
    let slug = customSlug ? generateSlug(customSlug) : generateSlug(name);
    slug = await ensureUniqueSlug(slug);

    // Hash password if provided
    let hashedPassword = null;
    if (isPasswordProtected && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const tour = await prisma.tour.create({
      data: {
        name,
        slug,
        description,
        clientName,
        projectRef,
        isPasswordProtected: isPasswordProtected || false,
        password: hashedPassword,
        ambientMusicUrl,
        ambientMusicVolume: ambientMusicVolume ?? 0.5,
        settings: settings || {},
        createdById: req.user.id
      }
    });

    // Remove password from response
    const { password: _, ...tourWithoutPassword } = tour;

    res.status(201).json({ tour: tourWithoutPassword });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// PUT /api/tours/:id - Update tour
// ===========================================
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug: customSlug,
      description,
      thumbnail,
      clientName,
      projectRef,
      isPublished,
      isPasswordProtected,
      password,
      ambientMusicUrl,
      ambientMusicVolume,
      settings
    } = req.body;

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (projectRef !== undefined) updateData.projectRef = projectRef;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (ambientMusicUrl !== undefined) updateData.ambientMusicUrl = ambientMusicUrl;
    if (ambientMusicVolume !== undefined) updateData.ambientMusicVolume = ambientMusicVolume;
    if (settings !== undefined) updateData.settings = settings;

    // Handle slug update
    if (customSlug !== undefined) {
      let slug = generateSlug(customSlug);
      slug = await ensureUniqueSlug(slug, id);
      updateData.slug = slug;
    }

    // Handle password update
    if (isPasswordProtected !== undefined) {
      updateData.isPasswordProtected = isPasswordProtected;

      if (isPasswordProtected && password) {
        updateData.password = await bcrypt.hash(password, 10);
      } else if (!isPasswordProtected) {
        updateData.password = null;
      }
    }

    const tour = await prisma.tour.update({
      where: { id },
      data: updateData
    });

    // Remove password from response
    const { password: _, ...tourWithoutPassword } = tour;

    res.json({ tour: tourWithoutPassword });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }
    next(error);
  }
});

// ===========================================
// DELETE /api/tours/:id - Delete tour
// ===========================================
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // TODO: Also delete associated files from storage

    await prisma.tour.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }
    next(error);
  }
});

// ===========================================
// POST /api/tours/:id/publish - Publish tour
// ===========================================
router.post('/:id/publish', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const tour = await prisma.tour.update({
      where: { id },
      data: { isPublished: true }
    });

    const { password, ...tourWithoutPassword } = tour;

    res.json({ tour: tourWithoutPassword });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }
    next(error);
  }
});

// ===========================================
// POST /api/tours/:id/unpublish - Unpublish tour
// ===========================================
router.post('/:id/unpublish', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const tour = await prisma.tour.update({
      where: { id },
      data: { isPublished: false }
    });

    const { password, ...tourWithoutPassword } = tour;

    res.json({ tour: tourWithoutPassword });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }
    next(error);
  }
});

export default router;

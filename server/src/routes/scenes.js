// ===========================================
// Scenes Routes
// ===========================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ===========================================
// GET /api/tours/:tourId/scenes - List all scenes for a tour
// ===========================================
router.get('/:tourId/scenes', requireAuth, async (req, res, next) => {
  try {
    const { tourId } = req.params;

    const scenes = await prisma.scene.findMany({
      where: { tourId },
      include: { hotspots: true },
      orderBy: { order: 'asc' }
    });

    res.json({ scenes });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// GET /api/tours/:tourId/scenes/:sceneId - Get single scene
// ===========================================
router.get('/:tourId/scenes/:sceneId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, sceneId } = req.params;

    const scene = await prisma.scene.findFirst({
      where: { id: sceneId, tourId },
      include: { hotspots: true }
    });

    if (!scene) {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }

    res.json({ scene });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/tours/:tourId/scenes - Create new scene
// ===========================================
router.post('/:tourId/scenes', requireAuth, async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const {
      name,
      panoramaUrl,
      thumbnailUrl,
      stereoUrl,
      order,
      initialYaw,
      initialPitch,
      floorPlanId,
      floorPlanX,
      floorPlanY
    } = req.body;

    // Verify tour exists
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }

    // Get next order if not provided
    let sceneOrder = order;
    if (sceneOrder === undefined) {
      const lastScene = await prisma.scene.findFirst({
        where: { tourId },
        orderBy: { order: 'desc' }
      });
      sceneOrder = lastScene ? lastScene.order + 1 : 0;
    }

    const scene = await prisma.scene.create({
      data: {
        name: name || 'Untitled Scene',
        panoramaUrl,
        thumbnailUrl,
        stereoUrl,
        order: sceneOrder,
        initialYaw: initialYaw || 0,
        initialPitch: initialPitch || 0,
        floorPlanId,
        floorPlanX,
        floorPlanY,
        tourId
      },
      include: { hotspots: true }
    });

    res.status(201).json({ scene });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// PUT /api/tours/:tourId/scenes/:sceneId - Update scene
// ===========================================
router.put('/:tourId/scenes/:sceneId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, sceneId } = req.params;
    const {
      name,
      panoramaUrl,
      thumbnailUrl,
      stereoUrl,
      order,
      initialYaw,
      initialPitch,
      floorPlanId,
      floorPlanX,
      floorPlanY
    } = req.body;

    // Verify scene belongs to tour
    const existingScene = await prisma.scene.findFirst({
      where: { id: sceneId, tourId }
    });

    if (!existingScene) {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (panoramaUrl !== undefined) updateData.panoramaUrl = panoramaUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (stereoUrl !== undefined) updateData.stereoUrl = stereoUrl;
    if (order !== undefined) updateData.order = order;
    if (initialYaw !== undefined) updateData.initialYaw = initialYaw;
    if (initialPitch !== undefined) updateData.initialPitch = initialPitch;
    if (floorPlanId !== undefined) updateData.floorPlanId = floorPlanId;
    if (floorPlanX !== undefined) updateData.floorPlanX = floorPlanX;
    if (floorPlanY !== undefined) updateData.floorPlanY = floorPlanY;

    const scene = await prisma.scene.update({
      where: { id: sceneId },
      data: updateData,
      include: { hotspots: true }
    });

    res.json({ scene });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// DELETE /api/tours/:tourId/scenes/:sceneId - Delete scene
// ===========================================
router.delete('/:tourId/scenes/:sceneId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, sceneId } = req.params;

    // Verify scene belongs to tour
    const existingScene = await prisma.scene.findFirst({
      where: { id: sceneId, tourId }
    });

    if (!existingScene) {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }

    // Delete scene (cascades to hotspots)
    await prisma.scene.delete({ where: { id: sceneId } });

    // TODO: Also delete associated files from storage

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/tours/:tourId/scenes/reorder - Reorder scenes
// ===========================================
router.post('/:tourId/scenes/reorder', requireAuth, async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const { sceneIds } = req.body; // Array of scene IDs in new order

    if (!Array.isArray(sceneIds)) {
      return res.status(400).json({ error: { message: 'sceneIds must be an array' } });
    }

    // Update order for each scene
    const updates = sceneIds.map((id, index) =>
      prisma.scene.updateMany({
        where: { id, tourId },
        data: { order: index }
      })
    );

    await Promise.all(updates);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;

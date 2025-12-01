import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/scenes/:id - Get single scene
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const scene = await prisma.scene.findUnique({
      where: { id },
      include: { hotspots: true }
    });
    
    if (!scene) {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }
    
    res.json(scene);
  } catch (error) {
    next(error);
  }
});

// POST /api/scenes - Create new scene
router.post('/', async (req, res, next) => {
  try {
    const {
      tourId,
      name,
      description,
      order,
      panoramaUrl,
      stereoUrl,
      thumbnailUrl,
      initialYaw,
      initialPitch,
      initialFov,
      floorPlanX,
      floorPlanY
    } = req.body;
    
    if (!tourId || !name || !panoramaUrl) {
      return res.status(400).json({
        error: { message: 'tourId, name, and panoramaUrl are required' }
      });
    }
    
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
        tourId,
        name,
        description,
        order: sceneOrder,
        panoramaUrl,
        stereoUrl,
        thumbnailUrl,
        initialYaw: initialYaw || 0,
        initialPitch: initialPitch || 0,
        initialFov,
        floorPlanX,
        floorPlanY
      },
      include: { hotspots: true }
    });
    
    res.status(201).json(scene);
  } catch (error) {
    next(error);
  }
});

// PUT /api/scenes/:id - Update scene
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      order,
      panoramaUrl,
      stereoUrl,
      thumbnailUrl,
      initialYaw,
      initialPitch,
      initialFov,
      floorPlanX,
      floorPlanY
    } = req.body;
    
    const scene = await prisma.scene.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(panoramaUrl && { panoramaUrl }),
        ...(stereoUrl !== undefined && { stereoUrl }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(initialYaw !== undefined && { initialYaw }),
        ...(initialPitch !== undefined && { initialPitch }),
        ...(initialFov !== undefined && { initialFov }),
        ...(floorPlanX !== undefined && { floorPlanX }),
        ...(floorPlanY !== undefined && { floorPlanY })
      },
      include: { hotspots: true }
    });
    
    res.json(scene);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }
    next(error);
  }
});

// DELETE /api/scenes/:id - Delete scene
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.scene.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }
    next(error);
  }
});

// PUT /api/scenes/:id/reorder - Reorder scenes in a tour
router.put('/:tourId/reorder', async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const { sceneIds } = req.body; // Array of scene IDs in new order
    
    if (!Array.isArray(sceneIds)) {
      return res.status(400).json({
        error: { message: 'sceneIds must be an array' }
      });
    }
    
    // Update each scene's order
    const updates = sceneIds.map((id, index) =>
      prisma.scene.update({
        where: { id },
        data: { order: index }
      })
    );
    
    await prisma.$transaction(updates);
    
    // Return updated scenes
    const scenes = await prisma.scene.findMany({
      where: { tourId },
      orderBy: { order: 'asc' }
    });
    
    res.json(scenes);
  } catch (error) {
    next(error);
  }
});

export default router;

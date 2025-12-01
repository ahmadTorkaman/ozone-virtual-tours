// ===========================================
// Floor Plans Routes
// ===========================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ===========================================
// GET /api/tours/:tourId/floorplans - List all floor plans for a tour
// ===========================================
router.get('/:tourId/floorplans', requireAuth, async (req, res, next) => {
  try {
    const { tourId } = req.params;

    const floorPlans = await prisma.floorPlan.findMany({
      where: { tourId },
      orderBy: { floor: 'asc' }
    });

    res.json({ floorPlans });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// GET /api/tours/:tourId/floorplans/:floorPlanId - Get single floor plan
// ===========================================
router.get('/:tourId/floorplans/:floorPlanId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, floorPlanId } = req.params;

    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, tourId }
    });

    if (!floorPlan) {
      return res.status(404).json({ error: { message: 'Floor plan not found' } });
    }

    res.json({ floorPlan });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/tours/:tourId/floorplans - Create new floor plan
// ===========================================
router.post('/:tourId/floorplans', requireAuth, async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const { name, imageUrl, floor, width, height } = req.body;

    // Verify tour exists
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }

    // Get next floor number if not provided
    let floorNumber = floor;
    if (floorNumber === undefined) {
      const lastFloorPlan = await prisma.floorPlan.findFirst({
        where: { tourId },
        orderBy: { floor: 'desc' }
      });
      floorNumber = lastFloorPlan ? lastFloorPlan.floor + 1 : 0;
    }

    const floorPlan = await prisma.floorPlan.create({
      data: {
        name: name || `Floor ${floorNumber + 1}`,
        imageUrl,
        floor: floorNumber,
        width,
        height,
        tourId
      }
    });

    res.status(201).json({ floorPlan });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// PUT /api/tours/:tourId/floorplans/:floorPlanId - Update floor plan
// ===========================================
router.put('/:tourId/floorplans/:floorPlanId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, floorPlanId } = req.params;
    const { name, imageUrl, floor, width, height } = req.body;

    // Verify floor plan belongs to tour
    const existingFloorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, tourId }
    });

    if (!existingFloorPlan) {
      return res.status(404).json({ error: { message: 'Floor plan not found' } });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (floor !== undefined) updateData.floor = floor;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;

    const floorPlan = await prisma.floorPlan.update({
      where: { id: floorPlanId },
      data: updateData
    });

    res.json({ floorPlan });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// DELETE /api/tours/:tourId/floorplans/:floorPlanId - Delete floor plan
// ===========================================
router.delete('/:tourId/floorplans/:floorPlanId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, floorPlanId } = req.params;

    // Verify floor plan belongs to tour
    const existingFloorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, tourId }
    });

    if (!existingFloorPlan) {
      return res.status(404).json({ error: { message: 'Floor plan not found' } });
    }

    // Clear floor plan references from scenes
    await prisma.scene.updateMany({
      where: { floorPlanId },
      data: { floorPlanId: null, floorPlanX: null, floorPlanY: null }
    });

    // Delete floor plan
    await prisma.floorPlan.delete({ where: { id: floorPlanId } });

    // TODO: Also delete associated image from storage

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ===========================================
// PUT /api/tours/:tourId/floorplans/:floorPlanId/scenes/:sceneId - Position scene on floor plan
// ===========================================
router.put('/:tourId/floorplans/:floorPlanId/scenes/:sceneId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, floorPlanId, sceneId } = req.params;
    const { x, y } = req.body;

    // Verify floor plan belongs to tour
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, tourId }
    });

    if (!floorPlan) {
      return res.status(404).json({ error: { message: 'Floor plan not found' } });
    }

    // Verify scene belongs to tour
    const scene = await prisma.scene.findFirst({
      where: { id: sceneId, tourId }
    });

    if (!scene) {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }

    // Update scene position
    const updatedScene = await prisma.scene.update({
      where: { id: sceneId },
      data: {
        floorPlanId,
        floorPlanX: x,
        floorPlanY: y
      }
    });

    res.json({ scene: updatedScene });
  } catch (error) {
    next(error);
  }
});

export default router;

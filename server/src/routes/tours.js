import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tours - List all tours
router.get('/', async (req, res, next) => {
  try {
    const { published, projectRef } = req.query;
    
    const where = {};
    if (published === 'true') where.isPublished = true;
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
      orderBy: { updatedAt: 'desc' }
    });
    
    res.json(tours);
  } catch (error) {
    next(error);
  }
});

// GET /api/tours/:id - Get single tour with all details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        scenes: {
          include: {
            hotspots: true
          },
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
    
    res.json(tour);
  } catch (error) {
    next(error);
  }
});

// POST /api/tours - Create new tour
router.post('/', async (req, res, next) => {
  try {
    const { name, description, clientName, projectRef, settings } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: { message: 'Name is required' } });
    }
    
    const tour = await prisma.tour.create({
      data: {
        name,
        description,
        clientName,
        projectRef,
        settings: settings || {}
      }
    });
    
    res.status(201).json(tour);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tours/:id - Update tour
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, thumbnail, clientName, projectRef, isPublished, settings } = req.body;
    
    const tour = await prisma.tour.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(clientName !== undefined && { clientName }),
        ...(projectRef !== undefined && { projectRef }),
        ...(isPublished !== undefined && { isPublished }),
        ...(settings && { settings })
      }
    });
    
    res.json(tour);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }
    next(error);
  }
});

// DELETE /api/tours/:id - Delete tour
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.tour.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }
    next(error);
  }
});

// POST /api/tours/:id/publish - Publish tour
router.post('/:id/publish', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tour = await prisma.tour.update({
      where: { id },
      data: { isPublished: true }
    });
    
    res.json(tour);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }
    next(error);
  }
});

// POST /api/tours/:id/unpublish - Unpublish tour
router.post('/:id/unpublish', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tour = await prisma.tour.update({
      where: { id },
      data: { isPublished: false }
    });
    
    res.json(tour);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Tour not found' } });
    }
    next(error);
  }
});

export default router;

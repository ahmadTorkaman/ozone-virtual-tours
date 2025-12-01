import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hotspots/:id - Get single hotspot
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const hotspot = await prisma.hotspot.findUnique({
      where: { id }
    });
    
    if (!hotspot) {
      return res.status(404).json({ error: { message: 'Hotspot not found' } });
    }
    
    res.json(hotspot);
  } catch (error) {
    next(error);
  }
});

// POST /api/hotspots - Create new hotspot
router.post('/', async (req, res, next) => {
  try {
    const {
      sceneId,
      type,
      yaw,
      pitch,
      targetSceneId,
      title,
      content,
      mediaUrl,
      url,
      icon,
      color,
      scale
    } = req.body;
    
    if (!sceneId || yaw === undefined || pitch === undefined) {
      return res.status(400).json({
        error: { message: 'sceneId, yaw, and pitch are required' }
      });
    }
    
    // Validate type
    const validTypes = ['NAVIGATION', 'INFO', 'MEDIA', 'LINK'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        error: { message: `type must be one of: ${validTypes.join(', ')}` }
      });
    }
    
    // Verify scene exists
    const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
    if (!scene) {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }
    
    // Validate targetSceneId if NAVIGATION type
    if (type === 'NAVIGATION' && targetSceneId) {
      const targetScene = await prisma.scene.findUnique({ where: { id: targetSceneId } });
      if (!targetScene) {
        return res.status(400).json({ error: { message: 'Target scene not found' } });
      }
    }
    
    const hotspot = await prisma.hotspot.create({
      data: {
        sceneId,
        type: type || 'NAVIGATION',
        yaw,
        pitch,
        targetSceneId,
        title,
        content,
        mediaUrl,
        url,
        icon: icon || 'arrow',
        color: color || '#7c8cfb',
        scale: scale || 1.0
      }
    });
    
    res.status(201).json(hotspot);
  } catch (error) {
    next(error);
  }
});

// PUT /api/hotspots/:id - Update hotspot
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type,
      yaw,
      pitch,
      targetSceneId,
      title,
      content,
      mediaUrl,
      url,
      icon,
      color,
      scale
    } = req.body;
    
    const hotspot = await prisma.hotspot.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(yaw !== undefined && { yaw }),
        ...(pitch !== undefined && { pitch }),
        ...(targetSceneId !== undefined && { targetSceneId }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(mediaUrl !== undefined && { mediaUrl }),
        ...(url !== undefined && { url }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(scale !== undefined && { scale })
      }
    });
    
    res.json(hotspot);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Hotspot not found' } });
    }
    next(error);
  }
});

// DELETE /api/hotspots/:id - Delete hotspot
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.hotspot.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Hotspot not found' } });
    }
    next(error);
  }
});

// POST /api/hotspots/batch - Create multiple hotspots
router.post('/batch', async (req, res, next) => {
  try {
    const { hotspots } = req.body;
    
    if (!Array.isArray(hotspots)) {
      return res.status(400).json({
        error: { message: 'hotspots must be an array' }
      });
    }
    
    const created = await prisma.hotspot.createMany({
      data: hotspots.map(h => ({
        sceneId: h.sceneId,
        type: h.type || 'NAVIGATION',
        yaw: h.yaw,
        pitch: h.pitch,
        targetSceneId: h.targetSceneId,
        title: h.title,
        content: h.content,
        mediaUrl: h.mediaUrl,
        url: h.url,
        icon: h.icon || 'arrow',
        color: h.color || '#7c8cfb',
        scale: h.scale || 1.0
      }))
    });
    
    res.status(201).json({ count: created.count });
  } catch (error) {
    next(error);
  }
});

export default router;

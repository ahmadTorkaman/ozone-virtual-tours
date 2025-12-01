// ===========================================
// Hotspots Routes
// ===========================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ===========================================
// GET /api/tours/:tourId/scenes/:sceneId/hotspots - List all hotspots for a scene
// ===========================================
router.get('/:tourId/scenes/:sceneId/hotspots', requireAuth, async (req, res, next) => {
  try {
    const { tourId, sceneId } = req.params;

    // Verify scene belongs to tour
    const scene = await prisma.scene.findFirst({
      where: { id: sceneId, tourId }
    });

    if (!scene) {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }

    const hotspots = await prisma.hotspot.findMany({
      where: { sceneId }
    });

    res.json({ hotspots });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/tours/:tourId/scenes/:sceneId/hotspots - Create new hotspot
// ===========================================
router.post('/:tourId/scenes/:sceneId/hotspots', requireAuth, async (req, res, next) => {
  try {
    const { tourId, sceneId } = req.params;
    const {
      type,
      name,
      yaw,
      pitch,
      targetSceneId,
      title,
      content,
      mediaUrl,
      url,
      audioUrl,
      audioLoop,
      audioAutoplay,
      icon,
      color,
      scale
    } = req.body;

    // Verify scene belongs to tour
    const scene = await prisma.scene.findFirst({
      where: { id: sceneId, tourId }
    });

    if (!scene) {
      return res.status(404).json({ error: { message: 'Scene not found' } });
    }

    // Validate type
    const validTypes = ['NAVIGATION', 'INFO', 'MEDIA', 'LINK', 'AUDIO'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        error: { message: `type must be one of: ${validTypes.join(', ')}` }
      });
    }

    // Validate targetSceneId if NAVIGATION type
    if (type === 'NAVIGATION' && targetSceneId) {
      const targetScene = await prisma.scene.findFirst({
        where: { id: targetSceneId, tourId }
      });
      if (!targetScene) {
        return res.status(400).json({ error: { message: 'Target scene not found' } });
      }
    }

    const hotspot = await prisma.hotspot.create({
      data: {
        sceneId,
        type: type || 'NAVIGATION',
        name: name || 'Hotspot',
        yaw: yaw || 0,
        pitch: pitch || 0,
        targetSceneId,
        title,
        content,
        mediaUrl,
        url,
        audioUrl,
        audioLoop: audioLoop || false,
        audioAutoplay: audioAutoplay || false,
        icon: icon || 'arrow',
        color: color || '#7c8cfb',
        scale: scale || 1.0
      }
    });

    res.status(201).json({ hotspot });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// PUT /api/tours/:tourId/scenes/:sceneId/hotspots/:hotspotId - Update hotspot
// ===========================================
router.put('/:tourId/scenes/:sceneId/hotspots/:hotspotId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, sceneId, hotspotId } = req.params;
    const {
      type,
      name,
      yaw,
      pitch,
      targetSceneId,
      title,
      content,
      mediaUrl,
      url,
      audioUrl,
      audioLoop,
      audioAutoplay,
      icon,
      color,
      scale
    } = req.body;

    // Verify hotspot belongs to scene in tour
    const existingHotspot = await prisma.hotspot.findFirst({
      where: { id: hotspotId, sceneId },
      include: { scene: true }
    });

    if (!existingHotspot || existingHotspot.scene.tourId !== tourId) {
      return res.status(404).json({ error: { message: 'Hotspot not found' } });
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (yaw !== undefined) updateData.yaw = yaw;
    if (pitch !== undefined) updateData.pitch = pitch;
    if (targetSceneId !== undefined) updateData.targetSceneId = targetSceneId;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
    if (url !== undefined) updateData.url = url;
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
    if (audioLoop !== undefined) updateData.audioLoop = audioLoop;
    if (audioAutoplay !== undefined) updateData.audioAutoplay = audioAutoplay;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (scale !== undefined) updateData.scale = scale;

    const hotspot = await prisma.hotspot.update({
      where: { id: hotspotId },
      data: updateData
    });

    res.json({ hotspot });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// DELETE /api/tours/:tourId/scenes/:sceneId/hotspots/:hotspotId - Delete hotspot
// ===========================================
router.delete('/:tourId/scenes/:sceneId/hotspots/:hotspotId', requireAuth, async (req, res, next) => {
  try {
    const { tourId, sceneId, hotspotId } = req.params;

    // Verify hotspot belongs to scene in tour
    const existingHotspot = await prisma.hotspot.findFirst({
      where: { id: hotspotId, sceneId },
      include: { scene: true }
    });

    if (!existingHotspot || existingHotspot.scene.tourId !== tourId) {
      return res.status(404).json({ error: { message: 'Hotspot not found' } });
    }

    await prisma.hotspot.delete({ where: { id: hotspotId } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

// ===========================================
// Upload Routes
// ===========================================

import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import { validateFileType, sanitizeFilename } from '../middleware/fileValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for memory storage - images
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Configure multer for audio files
const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max for audio
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP3, WAV, OGG, and WebM audio are allowed.'));
    }
  }
});

// Ensure uploads directories exist - must match path in index.js
// From routes/upload.js, go up 3 levels to reach server/, then into uploads
const UPLOADS_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads');
const ensureUploadsDir = async () => {
  try {
    const dirs = ['panoramas', 'thumbnails', 'floorplans', 'audio', 'logos'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(UPLOADS_DIR, dir), { recursive: true });
    }
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};
ensureUploadsDir();

// Helper to get base URL
const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

// ===========================================
// POST /api/upload/panorama - Upload panorama image
// ===========================================
router.post('/panorama', requireAuth, uploadImage.single('file'), validateFileType('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileId = uuidv4();
    const filename = `${fileId}.jpg`;
    const thumbnailFilename = `${fileId}_thumb.jpg`;

    // Process and save panorama (convert to JPEG, optimize)
    const panoramaPath = path.join(UPLOADS_DIR, 'panoramas', filename);
    await sharp(req.file.buffer)
      .jpeg({ quality: 90, progressive: true })
      .toFile(panoramaPath);

    // Generate thumbnail (small preview for UI)
    const thumbnailPath = path.join(UPLOADS_DIR, 'thumbnails', thumbnailFilename);
    await sharp(req.file.buffer)
      .resize(400, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Get image metadata
    const metadata = await sharp(req.file.buffer).metadata();

    // Build full URLs for cross-origin access
    const baseUrl = getBaseUrl();

    res.json({
      success: true,
      url: `${baseUrl}/uploads/panoramas/${filename}`,
      panoramaUrl: `${baseUrl}/uploads/panoramas/${filename}`,
      thumbnailUrl: `${baseUrl}/uploads/thumbnails/${thumbnailFilename}`,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: req.file.size
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/upload/stereo - Upload stereo panorama
// ===========================================
router.post('/stereo', requireAuth, uploadImage.single('file'), validateFileType('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileId = uuidv4();
    const filename = `${fileId}_stereo.jpg`;

    // Process and save stereo panorama
    const stereoPath = path.join(UPLOADS_DIR, 'panoramas', filename);
    await sharp(req.file.buffer)
      .jpeg({ quality: 92, progressive: true })
      .toFile(stereoPath);

    // Validate aspect ratio (should be 2:1 for side-by-side stereo)
    const metadata = await sharp(req.file.buffer).metadata();
    const aspectRatio = metadata.width / metadata.height;

    if (aspectRatio < 1.9 || aspectRatio > 2.1) {
      console.warn(`Stereo panorama has unusual aspect ratio: ${aspectRatio.toFixed(2)}`);
    }

    const baseUrl = getBaseUrl();
    res.json({
      success: true,
      url: `${baseUrl}/uploads/panoramas/${filename}`,
      stereoUrl: `${baseUrl}/uploads/panoramas/${filename}`,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: aspectRatio.toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/upload/floorplan - Upload floor plan image
// ===========================================
router.post('/floorplan', requireAuth, uploadImage.single('file'), validateFileType('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileId = uuidv4();
    const filename = `${fileId}_floorplan.png`;

    // Process floor plan (keep as PNG for transparency)
    const floorplanPath = path.join(UPLOADS_DIR, 'floorplans', filename);
    await sharp(req.file.buffer)
      .png({ quality: 90 })
      .toFile(floorplanPath);

    const metadata = await sharp(req.file.buffer).metadata();

    const baseUrl = getBaseUrl();
    res.json({
      success: true,
      url: `${baseUrl}/uploads/floorplans/${filename}`,
      imageUrl: `${baseUrl}/uploads/floorplans/${filename}`,
      width: metadata.width,
      height: metadata.height
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/upload/audio - Upload audio file
// ===========================================
router.post('/audio', requireAuth, uploadAudio.single('file'), validateFileType('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileId = uuidv4();
    // Determine extension based on mimetype
    const extMap = {
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/webm': '.webm'
    };
    const ext = extMap[req.file.mimetype] || '.mp3';
    const filename = `${fileId}${ext}`;

    // Save audio file directly (no processing needed)
    const audioPath = path.join(UPLOADS_DIR, 'audio', filename);
    await fs.writeFile(audioPath, req.file.buffer);

    const baseUrl = getBaseUrl();
    res.json({
      success: true,
      url: `${baseUrl}/uploads/audio/${filename}`,
      audioUrl: `${baseUrl}/uploads/audio/${filename}`,
      metadata: {
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// POST /api/upload/logo - Upload company logo
// ===========================================
router.post('/logo', requireAuth, uploadImage.single('file'), validateFileType('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileId = uuidv4();
    const filename = `${fileId}_logo.png`;

    // Process logo - resize to reasonable size, keep transparency
    const logoPath = path.join(UPLOADS_DIR, 'logos', filename);
    await sharp(req.file.buffer)
      .resize(400, 200, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 90 })
      .toFile(logoPath);

    const metadata = await sharp(req.file.buffer).metadata();

    const baseUrl = getBaseUrl();
    res.json({
      success: true,
      url: `${baseUrl}/uploads/logos/${filename}`,
      logoUrl: `${baseUrl}/uploads/logos/${filename}`,
      metadata: {
        width: metadata.width,
        height: metadata.height
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// DELETE /api/upload/:type/:filename - Delete uploaded file
// ===========================================
router.delete('/:type/:filename', requireAuth, async (req, res, next) => {
  try {
    const { type, filename } = req.params;

    const validTypes = ['panoramas', 'thumbnails', 'floorplans', 'audio', 'logos'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: { message: 'Invalid file type' } });
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, type, sanitizedFilename);

    try {
      await fs.unlink(filePath);
      res.status(204).send();
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: { message: 'File not found' } });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

export default router;

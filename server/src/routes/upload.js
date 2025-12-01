import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
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

// Ensure uploads directory exists
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(path.join(UPLOADS_DIR, 'panoramas'), { recursive: true });
    await fs.mkdir(path.join(UPLOADS_DIR, 'thumbnails'), { recursive: true });
    await fs.mkdir(path.join(UPLOADS_DIR, 'floorplans'), { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};
ensureUploadsDir();

// POST /api/upload/panorama - Upload panorama image
router.post('/panorama', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileId = uuidv4();
    const ext = '.jpg'; // Standardize to JPEG for panoramas
    const filename = `${fileId}${ext}`;
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

    // In production, you'd upload to R2/S3 and return those URLs
    // For local dev, return local paths
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    res.json({
      success: true,
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

// POST /api/upload/stereo - Upload stereo panorama (side-by-side)
router.post('/stereo', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileId = uuidv4();
    const filename = `${fileId}_stereo.jpg`;

    // Process and save stereo panorama
    const stereoPath = path.join(UPLOADS_DIR, 'panoramas', filename);
    await sharp(req.file.buffer)
      .jpeg({ quality: 92, progressive: true }) // Higher quality for stereo
      .toFile(stereoPath);

    // Validate aspect ratio (should be 2:1 for side-by-side stereo)
    const metadata = await sharp(req.file.buffer).metadata();
    const aspectRatio = metadata.width / metadata.height;
    
    if (aspectRatio < 1.9 || aspectRatio > 2.1) {
      console.warn(`Stereo panorama has unusual aspect ratio: ${aspectRatio.toFixed(2)}`);
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    res.json({
      success: true,
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

// POST /api/upload/floorplan - Upload floor plan image
router.post('/floorplan', upload.single('file'), async (req, res, next) => {
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

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    res.json({
      success: true,
      imageUrl: `${baseUrl}/uploads/floorplans/${filename}`,
      width: metadata.width,
      height: metadata.height
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/upload/:type/:filename - Delete uploaded file
router.delete('/:type/:filename', async (req, res, next) => {
  try {
    const { type, filename } = req.params;
    
    const validTypes = ['panoramas', 'thumbnails', 'floorplans'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: { message: 'Invalid file type' } });
    }

    const filePath = path.join(UPLOADS_DIR, type, filename);
    
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

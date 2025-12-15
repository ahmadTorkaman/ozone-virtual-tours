// ===========================================
// Ozone Virtual Tours - API Server
// ===========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRouter from './routes/auth.js';
import toursRouter from './routes/tours.js';
import scenesRouter from './routes/scenes.js';
import hotspotsRouter from './routes/hotspots.js';
import floorPlansRouter from './routes/floorplans.js';
import uploadRouter from './routes/upload.js';
import settingsRouter from './routes/settings.js';
import libraryRouter from './routes/library.js';

// Middleware
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';

// Utils
import logger, { logError } from './utils/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// Middleware
// ===========================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP for now (A-Frame needs inline scripts)
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// ===========================================
// Static Files
// ===========================================

// Serve uploaded files
const uploadsPath = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));

// ===========================================
// Health Check
// ===========================================

const healthResponse = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.7.0'
  });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// ===========================================
// API Routes
// ===========================================

// Apply rate limiting
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/upload', uploadLimiter, uploadRouter);
app.use('/api', apiLimiter); // General API rate limit

app.use('/api/tours', toursRouter);
app.use('/api/tours', scenesRouter);      // /api/tours/:tourId/scenes/*
app.use('/api/tours', hotspotsRouter);    // /api/tours/:tourId/scenes/:sceneId/hotspots/*
app.use('/api/tours', floorPlansRouter);  // /api/tours/:tourId/floorplans/*
app.use('/api/settings', settingsRouter);
app.use('/api/library', libraryRouter);   // Material library for Ozone Material Editor

// ===========================================
// Error Handling
// ===========================================

// Global error handler
app.use((err, req, res, next) => {
  // Log the error with structured logging
  logError(err, req);

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: { message: 'A record with this value already exists' }
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: { message: 'Record not found' }
    });
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: { message: 'File too large' }
    });
  }

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

// ===========================================
// Start Server
// ===========================================

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`
  });
});

export default app;

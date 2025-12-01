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

// ===========================================
// Static Files
// ===========================================

// Serve uploaded files
const uploadsPath = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));

// ===========================================
// Health Check
// ===========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.2.0'
  });
});

// ===========================================
// API Routes
// ===========================================

app.use('/api/auth', authRouter);
app.use('/api/tours', toursRouter);
app.use('/api/tours', scenesRouter);      // /api/tours/:tourId/scenes/*
app.use('/api/tours', hotspotsRouter);    // /api/tours/:tourId/scenes/:sceneId/hotspots/*
app.use('/api/tours', floorPlansRouter);  // /api/tours/:tourId/floorplans/*
app.use('/api/upload', uploadRouter);
app.use('/api/settings', settingsRouter);

// ===========================================
// Error Handling
// ===========================================

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

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
  console.log(`🚀 Ozone Virtual Tours API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

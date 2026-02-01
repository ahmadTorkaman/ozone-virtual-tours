# Phase 2: Database & Backend Core

> **Estimated Scope**: Database schema, API structure, file upload system
> **Prerequisites**: Phase 1 complete (project foundation)
> **Outputs**: Fully functional backend with all API endpoints

---

## Overview

This phase builds the complete backend infrastructure:

1. Full Prisma schema with all models
2. Database migrations
3. Module-based API structure
4. Chunked upload system for large files (up to 1GB)
5. Authentication system (simplified, no teams)
6. All CRUD endpoints

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer for interior designers
- **Current State**: Phase 1 complete (TypeScript project structure ready)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Tech Stack**: Express.js + TypeScript + Prisma + PostgreSQL

Read `/docs/ARCHITECTURE.md` for full context and `/docs/phases/PHASE-1-PROJECT-FOUNDATION.md` for setup details.

---

## Task Checklist

### 2.1 Prisma Schema

Create the complete schema at `server/prisma/schema.prisma`:

```prisma
// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER & AUTHENTICATION
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?

  // Relations
  projects  Project[]
  materials Material[]
  sessions  Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}

// ============================================
// PROJECTS
// ============================================

model Project {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  thumbnail   String?

  // Visibility & Protection
  isPublished Boolean  @default(false)
  password    String?  // bcrypt hashed, for sharing

  // Owner
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Content
  scenes      Scene[]
  panoramas   Panorama[]

  // Settings (JSON for flexibility)
  settings    Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([slug])
  @@index([isPublished])
}

// ============================================
// 3D SCENES (GLB)
// ============================================

model Scene {
  id          String   @id @default(cuid())
  name        String
  description String?

  // GLB File
  glbUrl      String
  glbSize     Int      // File size in bytes
  thumbnail   String?

  // Initial camera position when entering scene
  spawnPosition Json?  // { x: number, y: number, z: number }
  spawnRotation Json?  // { x: number, y: number, z: number } (euler angles)

  // Optional navigation mesh for collision
  navMeshUrl  String?

  // Parent project
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Material overrides for objects in this scene
  materialMappings MaterialMapping[]

  // Ordering
  order       Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([order])
}

// ============================================
// PANORAMAS (360° Images)
// ============================================

model Panorama {
  id           String   @id @default(cuid())
  name         String
  description  String?

  // Image files
  imageUrl     String   // Equirectangular panorama
  stereoUrl    String?  // Side-by-side stereo for VR
  thumbnailUrl String?

  // Initial view direction
  initialYaw   Float    @default(0)  // Horizontal angle (degrees)
  initialPitch Float    @default(0)  // Vertical angle (degrees)

  // Parent project
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Hotspots in this panorama
  hotspots     Hotspot[]

  // Hotspots targeting this panorama
  incomingHotspots Hotspot[] @relation("HotspotTarget")

  // Ordering
  order        Int      @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([projectId])
  @@index([order])
}

model Hotspot {
  id        String      @id @default(cuid())
  type      HotspotType

  // Position (spherical coordinates)
  yaw       Float       // Horizontal angle (degrees)
  pitch     Float       // Vertical angle (degrees)

  // For NAVIGATION type: target panorama
  targetId  String?
  target    Panorama?   @relation("HotspotTarget", fields: [targetId], references: [id], onDelete: SetNull)

  // For INFO/MEDIA/LINK types: content data
  content   Json?       // { title, description, url, mediaUrl, etc. }

  // Visual customization
  icon      String?
  color     String?     // Hex color

  // Parent panorama
  panoramaId String
  panorama   Panorama   @relation(fields: [panoramaId], references: [id], onDelete: Cascade)

  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([panoramaId])
  @@index([targetId])
}

enum HotspotType {
  NAVIGATION
  INFO
  MEDIA
  LINK
}

// ============================================
// MATERIALS
// ============================================

model MaterialCategory {
  id        String     @id @default(cuid())
  name      String
  order     Int        @default(0)

  materials Material[]

  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([order])
}

model Material {
  id          String       @id @default(cuid())
  name        String
  description String?
  thumbnail   String?

  // Three.js material type
  type        MaterialType @default(PHYSICAL)

  // ========== Core Properties ==========
  color       String?      // Hex color (#ffffff)
  metalness   Float        @default(0)
  roughness   Float        @default(1)
  opacity     Float        @default(1)
  transparent Boolean      @default(false)

  // ========== Clearcoat (lacquer, car paint) ==========
  clearcoat          Float  @default(0)
  clearcoatRoughness Float  @default(0)

  // ========== Sheen (fabric, velvet) ==========
  sheen          Float   @default(0)
  sheenRoughness Float   @default(1)
  sheenColor     String? // Hex color

  // ========== Transmission (glass, water) ==========
  transmission Float @default(0)
  thickness    Float @default(0)
  ior          Float @default(1.5) // Index of refraction

  // ========== Iridescence (soap bubbles, oil) ==========
  iridescence    Float @default(0)
  iridescenceIOR Float @default(1.3)

  // ========== Anisotropy (brushed metal) ==========
  anisotropy         Float @default(0)
  anisotropyRotation Float @default(0)

  // ========== Texture Maps ==========
  mapUrl          String? // Albedo/diffuse
  normalMapUrl    String?
  roughnessMapUrl String?
  metalnessMapUrl String?
  aoMapUrl        String? // Ambient occlusion
  emissiveMapUrl  String?

  // Additional properties (for edge cases)
  properties  Json?

  // Category
  categoryId  String?
  category    MaterialCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  // Owner
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Used in scene mappings
  mappings    MaterialMapping[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([categoryId])
  @@index([type])
}

enum MaterialType {
  BASIC
  STANDARD
  PHYSICAL
}

// Links materials to objects within scenes
model MaterialMapping {
  id         String   @id @default(cuid())

  // Scene this mapping belongs to
  sceneId    String
  scene      Scene    @relation(fields: [sceneId], references: [id], onDelete: Cascade)

  // Material to apply
  materialId String
  material   Material @relation(fields: [materialId], references: [id], onDelete: Cascade)

  // Object identifier in GLB (mesh name)
  objectName String

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // One material per object per scene
  @@unique([sceneId, objectName])
  @@index([sceneId])
  @@index([materialId])
}

// ============================================
// BRANDING & SETTINGS
// ============================================

model BrandingSettings {
  id             String  @id @default(cuid())
  companyName    String?
  companyLogo    String?
  primaryColor   String  @default("#6366f1")
  secondaryColor String  @default("#4f46e5")

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// ============================================
// FILE UPLOADS (for chunked upload tracking)
// ============================================

model Upload {
  id          String       @id @default(cuid())
  filename    String
  mimeType    String
  totalSize   Int          // Total file size in bytes
  chunkSize   Int          // Size of each chunk
  totalChunks Int          // Total number of chunks
  uploadedChunks Int       @default(0) // Chunks received so far
  status      UploadStatus @default(PENDING)

  // Owner
  userId      String

  // Metadata
  metadata    Json?

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  expiresAt   DateTime     // Auto-cleanup if not completed

  @@index([userId])
  @@index([status])
  @@index([expiresAt])
}

enum UploadStatus {
  PENDING
  UPLOADING
  PROCESSING
  COMPLETED
  FAILED
  EXPIRED
}
```

### 2.2 Run Initial Migration

```bash
cd server
pnpm db:generate   # Generate Prisma client
pnpm db:migrate    # Create migration (name it "initial")
```

### 2.3 Create Type Definitions

Create `server/src/types/index.ts`:

```typescript
import { Request } from 'express';
import { User, Session } from '@prisma/client';

// Extend Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: Session;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Upload types
export interface ChunkUploadInit {
  filename: string;
  mimeType: string;
  totalSize: number;
}

export interface ChunkUploadResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
}
```

Create `server/src/types/express.d.ts`:

```typescript
import { User, Session } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}

export {};
```

### 2.4 Create Validation Schemas

Create `server/src/modules/auth/auth.validation.ts`:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

Create `server/src/modules/projects/projects.validation.ts`:

```typescript
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  password: z.string().min(4).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  password: z.string().min(4).nullable().optional(),
  isPublished: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
```

Create `server/src/modules/scenes/scenes.validation.ts`:

```typescript
import { z } from 'zod';

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const createSceneSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  glbUrl: z.string().url('Invalid GLB URL'),
  glbSize: z.number().int().positive(),
  thumbnail: z.string().url().optional(),
  spawnPosition: positionSchema.optional(),
  spawnRotation: positionSchema.optional(),
  navMeshUrl: z.string().url().optional(),
});

export const updateSceneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  thumbnail: z.string().url().nullable().optional(),
  spawnPosition: positionSchema.nullable().optional(),
  spawnRotation: positionSchema.nullable().optional(),
  navMeshUrl: z.string().url().nullable().optional(),
});

export const reorderScenesSchema = z.object({
  sceneIds: z.array(z.string().cuid()),
});

export type CreateSceneInput = z.infer<typeof createSceneSchema>;
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>;
```

Create `server/src/modules/materials/materials.validation.ts`:

```typescript
import { z } from 'zod';
import { MaterialType } from '@prisma/client';

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color');

export const createMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  thumbnail: z.string().url().optional(),
  type: z.nativeEnum(MaterialType).default('PHYSICAL'),

  // Core properties
  color: hexColorSchema.optional(),
  metalness: z.number().min(0).max(1).default(0),
  roughness: z.number().min(0).max(1).default(1),
  opacity: z.number().min(0).max(1).default(1),
  transparent: z.boolean().default(false),

  // Clearcoat
  clearcoat: z.number().min(0).max(1).default(0),
  clearcoatRoughness: z.number().min(0).max(1).default(0),

  // Sheen
  sheen: z.number().min(0).max(1).default(0),
  sheenRoughness: z.number().min(0).max(1).default(1),
  sheenColor: hexColorSchema.optional(),

  // Transmission
  transmission: z.number().min(0).max(1).default(0),
  thickness: z.number().min(0).default(0),
  ior: z.number().min(1).max(2.5).default(1.5),

  // Iridescence
  iridescence: z.number().min(0).max(1).default(0),
  iridescenceIOR: z.number().min(1).max(2.5).default(1.3),

  // Anisotropy
  anisotropy: z.number().min(-1).max(1).default(0),
  anisotropyRotation: z.number().min(0).max(Math.PI).default(0),

  // Textures
  mapUrl: z.string().url().optional(),
  normalMapUrl: z.string().url().optional(),
  roughnessMapUrl: z.string().url().optional(),
  metalnessMapUrl: z.string().url().optional(),
  aoMapUrl: z.string().url().optional(),
  emissiveMapUrl: z.string().url().optional(),

  // Category
  categoryId: z.string().cuid().optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial();

export const createMappingSchema = z.object({
  materialId: z.string().cuid(),
  objectName: z.string().min(1, 'Object name is required'),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type CreateMappingInput = z.infer<typeof createMappingSchema>;
```

### 2.5 Create Validation Middleware

Create `server/src/middleware/validation.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.query = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.params = result.data;
    next();
  };
}
```

### 2.6 Create Auth Module

Create `server/src/modules/auth/auth.service.ts`:

```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../core/database.js';
import { UnauthorizedError, ConflictError } from '../../core/errors.js';
import type { LoginInput, RegisterInput } from './auth.validation.js';

const SALT_ROUNDS = 12;
const SESSION_EXPIRY_DAYS = 7;

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const session = await createSession(user.id);

  return {
    user: sanitizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
    },
  });

  const session = await createSession(user.id);

  return {
    user: sanitizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function logout(token: string) {
  await prisma.session.deleteMany({
    where: { token },
  });
}

export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    session,
    user: sanitizeUser(session.user),
  };
}

export async function refreshSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Extend session
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: newExpiry },
  });

  return { expiresAt: newExpiry };
}

async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  return prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
}

function sanitizeUser(user: { id: string; email: string; name: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

// Cleanup expired sessions (call periodically)
export async function cleanupExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
```

Create `server/src/modules/auth/auth.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { validateSession } from './auth.service.js';
import { UnauthorizedError } from '../../core/errors.js';

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = extractToken(req);

  if (!token) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  const result = await validateSession(token);

  if (!result) {
    next(new UnauthorizedError('Invalid or expired session'));
    return;
  }

  req.user = result.user as any;
  req.session = result.session as any;
  next();
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = extractToken(req);

  if (token) {
    const result = await validateSession(token);
    if (result) {
      req.user = result.user as any;
      req.session = result.session as any;
    }
  }

  next();
}

function extractToken(req: Request): string | null {
  // Check cookie first
  if (req.cookies?.sessionToken) {
    return req.cookies.sessionToken;
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}
```

Create `server/src/modules/auth/auth.routes.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { requireAuth } from './auth.middleware.js';
import { validate } from '../../middleware/validation.js';
import { loginSchema, registerSchema } from './auth.validation.js';
import { config } from '../../core/config.js';

const router = Router();

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);

      res.cookie('sessionToken', result.token, cookieOptions);
      res.json({
        user: result.user,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);

      res.cookie('sessionToken', result.token, cookieOptions);
      res.status(201).json({
        user: result.user,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/logout
router.post(
  '/logout',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.sessionToken || '';
      await authService.logout(token);

      res.clearCookie('sessionToken');
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  (req: Request, res: Response) => {
    res.json({ user: req.user });
  }
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.sessionToken || '';
      const result = await authService.refreshSession(token);

      if (result) {
        res.json({ expiresAt: result.expiresAt });
      } else {
        res.status(401).json({ error: { message: 'Session expired' } });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### 2.7 Create Chunked Upload Module

Create `server/src/modules/storage/storage.service.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../../core/database.js';
import { config } from '../../core/config.js';
import { NotFoundError, ValidationError } from '../../core/errors.js';
import { logger } from '../../core/logger.js';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_EXPIRY_HOURS = 24;

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  glb: ['model/gltf-binary', 'application/octet-stream'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  texture: ['image/jpeg', 'image/png', 'image/webp', 'image/ktx2'],
};

export interface InitUploadParams {
  filename: string;
  mimeType: string;
  totalSize: number;
  userId: string;
  type: 'glb' | 'image' | 'audio' | 'texture';
}

export async function initializeUpload(params: InitUploadParams) {
  const { filename, mimeType, totalSize, userId, type } = params;

  // Validate MIME type
  const allowedMimes = ALLOWED_TYPES[type];
  if (!allowedMimes?.includes(mimeType)) {
    throw new ValidationError(`Invalid file type. Allowed: ${allowedMimes?.join(', ')}`);
  }

  // Calculate chunks
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  // Create upload record
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + UPLOAD_EXPIRY_HOURS);

  const upload = await prisma.upload.create({
    data: {
      filename: sanitizeFilename(filename),
      mimeType,
      totalSize,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      userId,
      status: 'PENDING',
      expiresAt,
    },
  });

  // Create temp directory for chunks
  const tempDir = getTempDir(upload.id);
  await fs.mkdir(tempDir, { recursive: true });

  return {
    uploadId: upload.id,
    chunkSize: CHUNK_SIZE,
    totalChunks,
    expiresAt,
  };
}

export async function uploadChunk(
  uploadId: string,
  chunkIndex: number,
  data: Buffer,
  userId: string
) {
  // Verify upload exists and belongs to user
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
  });

  if (!upload) {
    throw new NotFoundError('Upload');
  }

  if (upload.userId !== userId) {
    throw new ValidationError('Upload does not belong to user');
  }

  if (upload.status === 'COMPLETED' || upload.status === 'FAILED') {
    throw new ValidationError(`Upload already ${upload.status.toLowerCase()}`);
  }

  if (chunkIndex < 0 || chunkIndex >= upload.totalChunks) {
    throw new ValidationError(`Invalid chunk index: ${chunkIndex}`);
  }

  // Save chunk
  const chunkPath = getChunkPath(uploadId, chunkIndex);
  await fs.writeFile(chunkPath, data);

  // Update progress
  const chunks = await countChunks(uploadId);

  await prisma.upload.update({
    where: { id: uploadId },
    data: {
      uploadedChunks: chunks,
      status: 'UPLOADING',
    },
  });

  return {
    uploadedChunks: chunks,
    totalChunks: upload.totalChunks,
    complete: chunks === upload.totalChunks,
  };
}

export async function completeUpload(uploadId: string, userId: string) {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
  });

  if (!upload) {
    throw new NotFoundError('Upload');
  }

  if (upload.userId !== userId) {
    throw new ValidationError('Upload does not belong to user');
  }

  // Verify all chunks present
  const chunks = await countChunks(uploadId);
  if (chunks !== upload.totalChunks) {
    throw new ValidationError(`Missing chunks: ${chunks}/${upload.totalChunks}`);
  }

  // Update status
  await prisma.upload.update({
    where: { id: uploadId },
    data: { status: 'PROCESSING' },
  });

  try {
    // Assemble file
    const finalPath = await assembleChunks(upload);

    // Update status
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'COMPLETED' },
    });

    // Cleanup temp chunks
    await cleanupChunks(uploadId);

    // Return URL
    const relativePath = path.relative(config.uploadsDir, finalPath);
    const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    return {
      url,
      filename: upload.filename,
      size: upload.totalSize,
    };
  } catch (error) {
    // Mark as failed
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}

export async function getUploadStatus(uploadId: string, userId: string) {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
  });

  if (!upload) {
    throw new NotFoundError('Upload');
  }

  if (upload.userId !== userId) {
    throw new ValidationError('Upload does not belong to user');
  }

  return {
    id: upload.id,
    filename: upload.filename,
    status: upload.status,
    uploadedChunks: upload.uploadedChunks,
    totalChunks: upload.totalChunks,
    progress: Math.round((upload.uploadedChunks / upload.totalChunks) * 100),
  };
}

export async function cancelUpload(uploadId: string, userId: string) {
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
  });

  if (!upload) {
    throw new NotFoundError('Upload');
  }

  if (upload.userId !== userId) {
    throw new ValidationError('Upload does not belong to user');
  }

  // Cleanup
  await cleanupChunks(uploadId);
  await prisma.upload.delete({ where: { id: uploadId } });

  return { success: true };
}

// Cleanup expired uploads (run periodically)
export async function cleanupExpiredUploads() {
  const expired = await prisma.upload.findMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { status: 'FAILED' },
      ],
    },
  });

  let cleaned = 0;
  for (const upload of expired) {
    try {
      await cleanupChunks(upload.id);
      await prisma.upload.delete({ where: { id: upload.id } });
      cleaned++;
    } catch (error) {
      logger.error(`Failed to cleanup upload ${upload.id}:`, error);
    }
  }

  return cleaned;
}

// Helper functions

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

function getTempDir(uploadId: string): string {
  return path.join(config.uploadsDir, 'temp', uploadId);
}

function getChunkPath(uploadId: string, chunkIndex: number): string {
  return path.join(getTempDir(uploadId), `chunk_${chunkIndex.toString().padStart(6, '0')}`);
}

async function countChunks(uploadId: string): Promise<number> {
  const tempDir = getTempDir(uploadId);
  try {
    const files = await fs.readdir(tempDir);
    return files.filter(f => f.startsWith('chunk_')).length;
  } catch {
    return 0;
  }
}

async function assembleChunks(upload: { id: string; filename: string; mimeType: string; totalChunks: number }): Promise<string> {
  // Determine output directory based on type
  let outputDir: string;
  if (upload.mimeType.includes('gltf') || upload.mimeType === 'application/octet-stream') {
    outputDir = path.join(config.uploadsDir, 'glb');
  } else if (upload.mimeType.startsWith('image/')) {
    outputDir = path.join(config.uploadsDir, 'images');
  } else if (upload.mimeType.startsWith('audio/')) {
    outputDir = path.join(config.uploadsDir, 'audio');
  } else {
    outputDir = path.join(config.uploadsDir, 'other');
  }

  await fs.mkdir(outputDir, { recursive: true });

  // Generate unique filename
  const ext = path.extname(upload.filename) || '';
  const hash = crypto.randomBytes(8).toString('hex');
  const finalFilename = `${path.basename(upload.filename, ext)}_${hash}${ext}`;
  const finalPath = path.join(outputDir, finalFilename);

  // Assemble chunks
  const writeStream = await fs.open(finalPath, 'w');

  try {
    for (let i = 0; i < upload.totalChunks; i++) {
      const chunkPath = getChunkPath(upload.id, i);
      const chunkData = await fs.readFile(chunkPath);
      await writeStream.write(chunkData);
    }
  } finally {
    await writeStream.close();
  }

  return finalPath;
}

async function cleanupChunks(uploadId: string): Promise<void> {
  const tempDir = getTempDir(uploadId);
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    logger.warn(`Failed to cleanup chunks for ${uploadId}:`, error);
  }
}
```

Create `server/src/modules/storage/storage.routes.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as storageService from './storage.service.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { validate } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Multer for chunk uploads (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 11 * 1024 * 1024, // 11MB (chunk size + overhead)
  },
});

// Validation schemas
const initUploadSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  totalSize: z.number().int().positive().max(1024 * 1024 * 1024), // 1GB max
  type: z.enum(['glb', 'image', 'audio', 'texture']),
});

const chunkParamsSchema = z.object({
  uploadId: z.string().cuid(),
  chunkIndex: z.string().transform(Number),
});

// POST /api/upload/init - Initialize chunked upload
router.post(
  '/init',
  requireAuth,
  validate(initUploadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await storageService.initializeUpload({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/upload/:uploadId/chunk/:chunkIndex - Upload a chunk
router.post(
  '/:uploadId/chunk/:chunkIndex',
  requireAuth,
  upload.single('chunk'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = chunkParamsSchema.parse(req.params);

      if (!req.file) {
        res.status(400).json({ error: { message: 'No chunk data provided' } });
        return;
      }

      const result = await storageService.uploadChunk(
        params.uploadId,
        params.chunkIndex,
        req.file.buffer,
        req.user!.id
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/upload/:uploadId/complete - Complete upload
router.post(
  '/:uploadId/complete',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await storageService.completeUpload(
        req.params.uploadId,
        req.user!.id
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/upload/:uploadId/status - Get upload status
router.get(
  '/:uploadId/status',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await storageService.getUploadStatus(
        req.params.uploadId,
        req.user!.id
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/upload/:uploadId - Cancel upload
router.delete(
  '/:uploadId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await storageService.cancelUpload(
        req.params.uploadId,
        req.user!.id
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### 2.8 Create Rate Limiter Middleware

Create `server/src/middleware/rateLimiter.ts`:

```typescript
import rateLimit from 'express-rate-limit';
import { config } from '../core/config.js';

// Auth endpoints: stricter limits
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: {
      message: 'Too many authentication attempts. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isDevelopment,
});

// Upload endpoints: moderate limits
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Higher for chunk uploads
  message: {
    error: {
      message: 'Too many upload requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isDevelopment,
});

// General API: generous limits
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isDevelopment,
});

// Public viewer: moderate limits
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 2.9 Update Main Server Entry

Update `server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './core/config.js';
import { logger } from './core/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, uploadLimiter, publicLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import storageRoutes from './modules/storage/storage.routes.js';
// import projectRoutes from './modules/projects/projects.routes.js';
// import sceneRoutes from './modules/scenes/scenes.routes.js';
// import materialRoutes from './modules/materials/materials.routes.js';
// import panoramaRoutes from './modules/panoramas/panoramas.routes.js';
// import brandingRoutes from './modules/branding/branding.routes.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for SharedArrayBuffer (DRACO)
}));

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check (no rate limit)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply rate limiters to route groups
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/upload', uploadLimiter, storageRoutes);

// These will be added as modules are created:
// app.use('/api/projects', apiLimiter, projectRoutes);
// app.use('/api/scenes', apiLimiter, sceneRoutes);
// app.use('/api/materials', apiLimiter, materialRoutes);
// app.use('/api/panoramas', apiLimiter, panoramaRoutes);
// app.use('/api/branding', publicLimiter, brandingRoutes);

// Static files (uploads)
app.use('/uploads', express.static(config.uploadsDir, {
  maxAge: '1d',
  etag: true,
}));

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Uploads directory: ${config.uploadsDir}`);
});

export default app;
```

---

## Remaining Modules (Create Similarly)

The following modules follow the same pattern. Create these files:

### Projects Module
- `server/src/modules/projects/projects.service.ts`
- `server/src/modules/projects/projects.routes.ts`

### Scenes Module
- `server/src/modules/scenes/scenes.service.ts`
- `server/src/modules/scenes/scenes.routes.ts`

### Materials Module
- `server/src/modules/materials/materials.service.ts`
- `server/src/modules/materials/materials.routes.ts`

### Panoramas Module
- `server/src/modules/panoramas/panoramas.service.ts`
- `server/src/modules/panoramas/panoramas.routes.ts`

### Branding Module
- `server/src/modules/branding/branding.service.ts`
- `server/src/modules/branding/branding.routes.ts`

Each module follows the pattern:
1. **service.ts**: Business logic, database operations
2. **routes.ts**: Express routes, calls service functions
3. **validation.ts**: Zod schemas for input validation

---

## Verification Checklist

After completing Phase 2, verify:

- [ ] Prisma schema compiles: `pnpm db:generate`
- [ ] Migration runs: `pnpm db:migrate`
- [ ] Server starts: `pnpm dev`
- [ ] Health check works: `GET /api/health`
- [ ] Auth flow works:
  - [ ] Register: `POST /api/auth/register`
  - [ ] Login: `POST /api/auth/login`
  - [ ] Get me: `GET /api/auth/me`
  - [ ] Logout: `POST /api/auth/logout`
- [ ] Chunked upload works:
  - [ ] Init: `POST /api/upload/init`
  - [ ] Chunk: `POST /api/upload/:id/chunk/:index`
  - [ ] Complete: `POST /api/upload/:id/complete`
- [ ] Rate limiting works (returns 429 on abuse)

---

## API Reference

Full API documentation will be in `/docs/API.md` after this phase.

### Auth Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/auth/register | Create account | No |
| POST | /api/auth/login | Login | No |
| POST | /api/auth/logout | Logout | Yes |
| GET | /api/auth/me | Get current user | Yes |
| POST | /api/auth/refresh | Refresh session | Yes |

### Upload Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/upload/init | Start chunked upload | Yes |
| POST | /api/upload/:id/chunk/:index | Upload chunk | Yes |
| POST | /api/upload/:id/complete | Finalize upload | Yes |
| GET | /api/upload/:id/status | Get progress | Yes |
| DELETE | /api/upload/:id | Cancel upload | Yes |

---

## Next Phase

After Phase 2 is complete, proceed to **Phase 3: Scene Viewer** which covers:
- React Three Fiber setup
- GLB loading with progress
- First-person controls
- Object selection

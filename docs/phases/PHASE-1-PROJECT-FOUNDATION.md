# Phase 1: Project Foundation

> **Estimated Scope**: Complete project restructure and configuration
> **Prerequisites**: None (first phase)
> **Outputs**: Clean TypeScript project structure ready for development

---

## Overview

This phase establishes the foundation for the entire refactor. We will:

1. Clean up the existing codebase structure
2. Convert from JavaScript to TypeScript
3. Set up proper tooling (ESLint, Prettier, Vitest)
4. Configure the development environment
5. Establish folder conventions that align with Ozone patterns

**Important**: This phase is about structure and configuration only. No feature code is written yet.

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase, here's what you need to know:

- **Project**: Ozone Studio (refactor of ozone-virtual-tours)
- **Purpose**: 3D scene viewer for interior designers with material editing and VR support
- **Tech Stack**: React + TypeScript + Vite (client), Express + TypeScript + Prisma (server)
- **Current State**: Existing JavaScript codebase being refactored
- **Goal**: Set up clean TypeScript project structure

Read `/docs/ARCHITECTURE.md` for full context.

---

## Task Checklist

### 1.1 Clean Up Existing Files

- [ ] Archive current `client/src` to `_archive/client-old`
- [ ] Archive current `server/src` to `_archive/server-old`
- [ ] Keep `server/prisma` (will be modified in Phase 2)
- [ ] Keep `docker/` configuration
- [ ] Keep root configuration files (docker-compose, etc.)
- [ ] Remove `shared/` (will be recreated)

### 1.2 Create New Folder Structure

```
ozone-studio/
├── client/
│   ├── src/
│   │   ├── engine/           # Three.js core (Phase 3)
│   │   ├── features/         # Feature modules
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── scene-viewer/ # (Phase 3)
│   │   │   ├── materials/    # (Phase 4)
│   │   │   ├── panorama/     # (Phase 7)
│   │   │   └── branding/
│   │   ├── components/       # Shared UI components
│   │   │   ├── ui/           # Primitives (Button, Input, etc.)
│   │   │   ├── layout/       # Layout components
│   │   │   └── feedback/     # Loading, Error, Toast
│   │   ├── stores/           # Zustand stores
│   │   ├── services/         # API client, storage
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript types
│   │   ├── lib/              # Utility functions
│   │   ├── styles/           # Global styles
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── modules/          # Domain modules
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   └── auth.validation.ts
│   │   │   ├── projects/
│   │   │   ├── scenes/
│   │   │   ├── materials/
│   │   │   ├── panoramas/
│   │   │   ├── storage/
│   │   │   └── branding/
│   │   ├── core/
│   │   │   ├── database.ts   # Prisma instance
│   │   │   ├── config.ts     # Environment config
│   │   │   ├── errors.ts     # Custom errors
│   │   │   └── logger.ts     # Winston logger
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   ├── validation.ts
│   │   │   └── rateLimiter.ts
│   │   ├── types/
│   │   │   └── express.d.ts  # Express type extensions
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma     # (Updated in Phase 2)
│   │   └── migrations/
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                   # Shared between client/server
│   ├── constants/
│   │   ├── materials.ts
│   │   ├── hotspots.ts
│   │   └── index.ts
│   └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── phases/
│
├── docker/
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── nginx/
│
├── _archive/                 # Old code for reference
│   ├── client-old/
│   └── server-old/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspaces
└── turbo.json                # Turbo build config (optional)
```

### 1.3 Set Up Root Workspace

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'client'
  - 'server'
  - 'shared'
```

Create root `package.json`:
```json
{
  "name": "ozone-studio",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel run dev",
    "build": "pnpm --parallel run build",
    "lint": "pnpm --parallel run lint",
    "test": "pnpm --parallel run test",
    "clean": "pnpm --parallel run clean"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 1.4 Configure Client Package

Create `client/package.json`:
```json
{
  "name": "@ozone-studio/client",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx --fix",
    "test": "vitest",
    "clean": "rm -rf dist node_modules/.vite"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2"
  }
}
```

Create `client/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `client/tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

Create `client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

Create `client/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
};
```

Create `client/postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 1.5 Configure Server Package

Create `server/package.json`:
```json
{
  "name": "@ozone-studio/server",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts --fix",
    "test": "vitest",
    "clean": "rm -rf dist",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.7.1",
    "bcrypt": "^5.1.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.1",
    "winston": "^3.11.0",
    "zod": "^3.22.4",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.6",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.8",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "prisma": "^5.7.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "vitest": "^1.2.0"
  }
}
```

Create `server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.6 Configure Shared Package

Create `shared/package.json`:
```json
{
  "name": "@ozone-studio/shared",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./constants": "./constants/index.ts"
  }
}
```

Create `shared/constants/index.ts`:
```typescript
export * from './materials';
export * from './hotspots';
```

Create `shared/constants/materials.ts`:
```typescript
export const MATERIAL_TYPES = {
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
  PHYSICAL: 'PHYSICAL',
} as const;

export type MaterialType = keyof typeof MATERIAL_TYPES;

export const DEFAULT_MATERIAL_CATEGORIES = [
  'Metals',
  'Woods',
  'Fabrics',
  'Glass',
  'Stone',
  'Plastics',
  'Custom',
] as const;

export const MATERIAL_DEFAULTS = {
  color: '#ffffff',
  metalness: 0,
  roughness: 1,
  opacity: 1,
  clearcoat: 0,
  clearcoatRoughness: 0,
  transmission: 0,
  thickness: 0,
  ior: 1.5,
  sheen: 0,
  sheenRoughness: 1,
  sheenColor: '#ffffff',
  iridescence: 0,
  iridescenceIOR: 1.3,
  anisotropy: 0,
  anisotropyRotation: 0,
} as const;
```

Create `shared/constants/hotspots.ts`:
```typescript
export const HOTSPOT_TYPES = {
  NAVIGATION: 'NAVIGATION',
  INFO: 'INFO',
  MEDIA: 'MEDIA',
  LINK: 'LINK',
} as const;

export type HotspotType = keyof typeof HOTSPOT_TYPES;

export const HOTSPOT_COLORS: Record<HotspotType, string> = {
  NAVIGATION: '#3b82f6', // blue
  INFO: '#22c55e',       // green
  MEDIA: '#a855f7',      // purple
  LINK: '#f59e0b',       // amber
};
```

Create `shared/index.ts`:
```typescript
export * from './constants';
```

### 1.7 Create Base Client Files

Create `client/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#6366f1" />
    <link rel="manifest" href="/manifest.json" />
    <title>Ozone Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `client/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

Create `client/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Placeholder pages - will be implemented in later phases
function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Ozone Studio</h1>
        <p className="text-gray-400">3D Scene Viewer for Interior Designers</p>
        <p className="text-sm text-gray-500 mt-8">Phase 1 Complete - Foundation Ready</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Routes will be added in later phases */}
      </Routes>
    </BrowserRouter>
  );
}
```

Create `client/src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
}

body {
  @apply bg-gray-900 text-white antialiased;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-600 rounded;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}
```

Create `client/src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Create `client/public/manifest.json`:
```json
{
  "name": "Ozone Studio",
  "short_name": "Ozone Studio",
  "description": "3D Scene Viewer for Interior Designers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 1.8 Create Base Server Files

Create `server/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './core/config.js';
import { logger } from './core/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'"], // For Three.js DRACO
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be added in Phase 2
// app.use('/api/auth', authRoutes);
// app.use('/api/projects', projectRoutes);
// etc.

// Static files (uploads)
app.use('/uploads', express.static(config.uploadsDir));

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
```

Create `server/src/core/config.ts`:
```typescript
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(32),
  UPLOADS_DIR: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  corsOrigin: env.CORS_ORIGIN,
  sessionSecret: env.SESSION_SECRET,
  uploadsDir: env.UPLOADS_DIR || path.resolve(__dirname, '../../uploads'),
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
} as const;
```

Create `server/src/core/logger.ts`:
```typescript
import winston from 'winston';
import { config } from './config.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    }),
  ],
});

// Add file transport in production
if (config.isProduction) {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
  }));
}
```

Create `server/src/core/database.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// Single Prisma instance (fixes the 8-instance problem from old codebase)
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log queries in development
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true') {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  }
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

Create `server/src/core/errors.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}
```

Create `server/src/middleware/errorHandler.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../core/errors.js';
import { logger } from '../core/logger.js';
import { config } from '../core/config.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // AppError (our custom errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: err.errors,
      },
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          error: {
            message: 'A record with this value already exists',
            code: 'CONFLICT',
          },
        });
        return;
      case 'P2025':
        res.status(404).json({
          error: {
            message: 'Record not found',
            code: 'NOT_FOUND',
          },
        });
        return;
      case 'P2003':
        res.status(400).json({
          error: {
            message: 'Invalid reference',
            code: 'INVALID_REFERENCE',
          },
        });
        return;
    }
  }

  // Multer file size error
  if (err.message === 'File too large') {
    res.status(413).json({
      error: {
        message: 'File size exceeds limit',
        code: 'FILE_TOO_LARGE',
      },
    });
    return;
  }

  // Unknown error
  res.status(500).json({
    error: {
      message: config.isProduction ? 'Internal server error' : err.message,
      code: 'INTERNAL_ERROR',
      ...(config.isDevelopment && { stack: err.stack }),
    },
  });
}
```

### 1.9 Create ESLint Configuration

Create `client/.eslintrc.cjs`:
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react', '@typescript-eslint'],
  settings: {
    react: { version: '18.2' },
  },
  rules: {
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

Create `server/.eslintrc.cjs`:
```javascript
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

### 1.10 Create Environment Files

Create `.env.example`:
```bash
# Server
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/ozone_studio"
SESSION_SECRET="your-super-secret-key-at-least-32-characters"
CORS_ORIGIN="http://localhost:5173"
UPLOADS_DIR="./uploads"

# Optional: Enable query logging
LOG_QUERIES=false

# Client (prefix with VITE_ for Vite)
VITE_API_URL="http://localhost:3000"
```

Update `.gitignore`:
```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Prisma
prisma/*.db
prisma/*.db-journal

# Uploads (keep structure, ignore content)
uploads/*
!uploads/.gitkeep

# Archive (old code)
_archive/

# Temp files
*.tmp
*.temp
.cache/
```

### 1.11 Update Docker Configuration

Update `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ozone-studio-db
    environment:
      POSTGRES_USER: ozone
      POSTGRES_PASSWORD: ozone_dev_password
      POSTGRES_DB: ozone_studio
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ozone -d ozone_studio"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## Verification Checklist

After completing Phase 1, verify:

- [ ] `pnpm install` runs without errors
- [ ] `pnpm run dev` starts both client and server
- [ ] Client accessible at http://localhost:5173
- [ ] Server health check at http://localhost:3000/api/health returns OK
- [ ] TypeScript compiles without errors (`pnpm run build`)
- [ ] ESLint passes (`pnpm run lint`)
- [ ] Docker Compose starts PostgreSQL (`docker-compose up -d postgres`)

---

## Notes for Implementation

1. **Order matters**: Create folders before files that go in them
2. **Environment**: Copy `.env.example` to `.env` and fill in values
3. **Database**: PostgreSQL must be running before server starts
4. **pnpm**: Use pnpm (not npm/yarn) for workspace support

---

## Next Phase

After Phase 1 is complete, proceed to **Phase 2: Database & Backend Core** which covers:
- Full Prisma schema implementation
- API route structure
- Chunked upload system
- Authentication endpoints

# Ozone Studio - Architecture Document

> **Version**: 1.0.0
> **Last Updated**: 2026-02-02
> **Status**: Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vision & Goals](#vision--goals)
3. [Target Users](#target-users)
4. [Core Features](#core-features)
5. [Technology Stack](#technology-stack)
6. [System Architecture](#system-architecture)
7. [Data Architecture](#data-architecture)
8. [File Storage Strategy](#file-storage-strategy)
9. [Security Model](#security-model)
10. [Performance Considerations](#performance-considerations)
11. [Development Phases](#development-phases)
12. [Glossary](#glossary)
13. [Decision Log](#decision-log)

---

## Executive Summary

**Ozone Studio** (formerly Ozone Virtual Tours) is a web application for interior designers and architects to:

1. Upload and view 3D scenes (GLB format) with walkthrough capability
2. Apply and swap materials on objects within scenes using a material library
3. Experience scenes in VR (WebXR)
4. Share scenes with clients via password-protected links
5. Work offline via PWA capabilities

This document serves as the architectural blueprint for a complete refactor of the existing codebase.

### What's Changing

| Aspect | Before (Current) | After (Refactor) |
|--------|------------------|------------------|
| Primary Feature | Panoramic 360° images | 3D GLB scene walkthrough |
| 3D Engine | A-Frame (declarative) | React Three Fiber (programmatic) |
| Language | JavaScript | TypeScript |
| Material Storage | JSON blob in single table | Proper relational tables |
| File Upload | Single request | Chunked upload (supports 1GB+) |
| Offline Support | None | PWA with selective caching |
| Team Management | Full team system | Removed (single-user + branding) |
| Panorama Viewer | Primary feature | Secondary/parallel feature |

### What's Staying

- PostgreSQL database (Prisma ORM)
- Express.js backend
- React frontend (Vite bundler)
- Zustand state management
- Branding customization
- VR support (enhanced)
- Session-based authentication

---

## Vision & Goals

### Vision Statement

> Enable interior designers and architects to showcase their 3D designs in an immersive, interactive experience where clients can walk through spaces and see material options in real-time.

### Primary Goals

1. **Immersive Viewing** - First-person walkthrough of 3D scenes with VR support
2. **Material Flexibility** - Change materials on any object using a curated library
3. **Large File Support** - Handle GLB files up to 1GB reliably
4. **Offline Capability** - Work without internet connection (PWA)
5. **Simple Sharing** - Share via link with optional password protection
6. **Ozone Integration** - Prepared for future integration into Ozone monorepo

### Non-Goals (Out of Scope)

- Real-time collaboration (multiple users editing simultaneously)
- 3D modeling/editing capabilities (users bring their own GLB files)
- Animation editing (playback only)
- Mobile VR (focus on desktop/tethered VR)
- Multi-tenant SaaS (single-user/small team deployment)

---

## Target Users

### Primary User: Interior Designer / Architect

**Profile:**
- Creates 3D interior designs in tools like Blender, 3ds Max, SketchUp
- Exports baked scenes as GLB files (1-1000MB typically)
- Needs to present designs to clients
- Wants to show material alternatives quickly
- May use VR headset for presentations

**User Journey:**
```
1. Upload GLB scene
2. Walk through to verify
3. Identify objects that need material options
4. Assign materials from library
5. Share link with client
6. Client views and explores
7. Client requests material changes
8. Designer updates and re-shares
```

### Secondary User: Client / Viewer

**Profile:**
- Non-technical end user
- Views shared scenes via link
- May or may not have VR headset
- Needs simple, intuitive controls

**User Journey:**
```
1. Receive link from designer
2. Enter password (if required)
3. View scene in browser
4. Walk around using mouse/keyboard or VR
5. (Future: Select material preferences)
```

---

## Core Features

### F1: Project Management

- Create, rename, delete projects
- Each project contains multiple scenes and/or panoramas
- Project-level settings (thumbnail, description, password)
- Publish/unpublish for sharing

### F2: 3D Scene Viewer

- Load and display GLB files
- First-person walkthrough controls (WASD + mouse)
- Object selection via click/ray-cast
- Smooth camera movement
- Loading progress indication
- Support for large files (streaming/progressive loading)

### F3: Material System

- Material library with categories
- Full MeshPhysicalMaterial support:
  - Base: color, metalness, roughness
  - Clearcoat: clearcoat, clearcoatRoughness
  - Sheen: sheen, sheenRoughness, sheenColor
  - Transmission: transmission, thickness, ior
  - Iridescence: iridescence, iridescenceIOR
  - Anisotropy: anisotropy, anisotropyRotation
- Texture maps: albedo, normal, roughness, metalness, AO, emissive
- Apply material to selected object
- Save material mappings per scene
- Material preview (sphere/cube)

### F4: VR Mode

- WebXR integration
- Enter/exit VR via button
- VR locomotion (teleport or smooth movement)
- VR object selection (controller ray-cast)
- VR UI for material selection (floating panels)

### F5: Panorama Viewer (Secondary)

- View 360° equirectangular images
- Hotspot navigation between panoramas
- Info/media/link hotspots
- Stereo support for VR
- (Maintained for backward compatibility)

### F6: PWA & Offline

- Installable as desktop/mobile app
- Offline UI and navigation
- Selective scene caching (user-initiated)
- Background sync for changes
- Storage usage warnings

### F7: Branding

- Company name and logo
- Primary/secondary colors
- Applied to viewer UI

### F8: File Upload

- Chunked upload for large files (10MB chunks)
- Resume interrupted uploads
- Progress indication
- Server-side validation
- Automatic thumbnail generation

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| React Three Fiber | 8.x | Three.js React bindings |
| Three.js | 0.160+ | 3D rendering engine |
| @react-three/drei | 9.x | R3F helpers |
| @react-three/xr | 5.x | WebXR support |
| Zustand | 4.x | State management |
| TanStack Query | 5.x | Server state management |
| Tailwind CSS | 3.x | Styling |
| Radix UI | 1.x | Accessible UI primitives |
| Workbox | 7.x | Service worker tooling |
| idb | 8.x | IndexedDB wrapper |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| Express | 4.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | Database ORM |
| PostgreSQL | 15+ | Database |
| Zod | 3.x | Validation |
| Winston | 3.x | Logging |
| Multer | 1.x | File upload handling |
| Sharp | 0.33+ | Image processing |
| bcrypt | 5.x | Password hashing |
| helmet | 7.x | Security headers |

### DevOps

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy, static serving |
| Certbot | SSL certificates |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| Playwright | E2E testing |

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React     │  │   Zustand   │  │    React Three Fiber    │  │
│  │     UI      │  │   Stores    │  │    (Three.js + WebXR)   │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                    TanStack Query                          │  │
│  │              (API calls, caching, sync)                    │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │              Service Worker + IndexedDB                    │  │
│  │                   (Offline support)                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER (Linux)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       Nginx                              │    │
│  │         (Reverse proxy, static files, SSL)               │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐    │
│  │                    Express.js API                        │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │    │
│  │  │   Auth   │ │ Projects │ │  Scenes  │ │Materials │    │    │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │    │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐     │    │
│  │  │ Storage  │ │ Panorama │ │      Branding        │     │    │
│  │  │  Module  │ │  Module  │ │       Module         │     │    │
│  │  └──────────┘ └──────────┘ └──────────────────────┘     │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐    │
│  │                      Prisma ORM                          │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐    │
│  │                     PostgreSQL                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   File System                            │    │
│  │        /uploads/glb, /uploads/textures, etc.             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow Examples

**Viewing a Scene:**
```
1. Client requests /api/projects/:slug
2. Server validates auth (if private) or password (if protected)
3. Server returns project metadata + scene list
4. Client requests scene GLB via streaming endpoint
5. Three.js progressively loads GLB
6. Client fetches material mappings
7. Three.js applies materials to objects
8. User interacts with scene
```

**Uploading a GLB (Large File):**
```
1. Client: POST /api/upload/initiate { filename, size, type }
2. Server: Returns { uploadId, chunkSize: 10MB, totalChunks }
3. Client: For each chunk:
   - POST /api/upload/chunk/:uploadId { chunkIndex, data }
   - Server: Stores chunk to temp location
4. Client: POST /api/upload/complete/:uploadId
5. Server: Assembles chunks, validates GLB, generates thumbnail
6. Server: Returns { url, thumbnailUrl }
```

**Applying a Material:**
```
1. User clicks object in scene
2. Client identifies mesh name from GLB
3. User selects material from library
4. Client: POST /api/scenes/:id/mappings { objectName, materialId }
5. Server: Upserts MaterialMapping record
6. Client: Updates Three.js material on mesh
```

---

## Data Architecture

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │   Project    │       │    Scene     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │──┐    │ id           │──┐    │ id           │
│ email        │  │    │ slug         │  │    │ name         │
│ password     │  │    │ name         │  │    │ glbUrl       │
│ name         │  └───▶│ userId       │  └───▶│ projectId    │
│ createdAt    │       │ isPublished  │       │ spawnPosition│
│ updatedAt    │       │ password     │       │ navMeshUrl   │
└──────────────┘       │ createdAt    │       │ order        │
       │               └──────────────┘       └──────────────┘
       │                      │                      │
       │                      │                      │
       │               ┌──────┴──────┐               │
       │               ▼             ▼               │
       │        ┌──────────────┐  ┌──────────────┐   │
       │        │   Panorama   │  │MaterialMapping│◀─┘
       │        ├──────────────┤  ├──────────────┤
       │        │ id           │  │ id           │
       │        │ name         │  │ sceneId      │──────┐
       │        │ imageUrl     │  │ materialId   │──┐   │
       │        │ projectId    │  │ objectName   │  │   │
       │        │ initialYaw   │  └──────────────┘  │   │
       │        └──────────────┘                    │   │
       │               │                            │   │
       │               ▼                            │   │
       │        ┌──────────────┐                    │   │
       │        │   Hotspot    │                    │   │
       │        ├──────────────┤                    │   │
       │        │ id           │                    │   │
       │        │ type         │                    │   │
       │        │ yaw, pitch   │                    │   │
       │        │ panoramaId   │                    │   │
       │        │ targetId     │                    │   │
       │        └──────────────┘                    │   │
       │                                            │   │
       ▼                                            ▼   │
┌──────────────┐                            ┌──────────────┐
│   Material   │◀───────────────────────────│              │
├──────────────┤                            │   (joins)    │
│ id           │                            │              │
│ name         │                            └──────────────┘
│ type         │
│ color        │       ┌──────────────┐
│ metalness    │       │  Material    │
│ roughness    │◀──────│  Category    │
│ clearcoat    │       ├──────────────┤
│ transmission │       │ id           │
│ ...textures  │       │ name         │
│ categoryId   │       │ order        │
│ userId       │       └──────────────┘
└──────────────┘

┌──────────────┐       ┌──────────────┐
│   Session    │       │  Branding    │
├──────────────┤       │  Settings    │
│ id           │       ├──────────────┤
│ userId       │       │ id           │
│ token        │       │ companyName  │
│ expiresAt    │       │ companyLogo  │
└──────────────┘       │ primaryColor │
                       │ secondaryColor│
                       └──────────────┘
```

### Key Relationships

| Relationship | Type | Cascade |
|--------------|------|---------|
| User → Projects | 1:N | Delete projects when user deleted |
| Project → Scenes | 1:N | Delete scenes when project deleted |
| Project → Panoramas | 1:N | Delete panoramas when project deleted |
| Scene → MaterialMappings | 1:N | Delete mappings when scene deleted |
| Material → MaterialMappings | 1:N | Delete mappings when material deleted |
| Panorama → Hotspots | 1:N | Delete hotspots when panorama deleted |
| MaterialCategory → Materials | 1:N | Set null when category deleted |

---

## File Storage Strategy

### Directory Structure

```
/var/ozone-studio/
├── uploads/
│   ├── glb/                    # 3D scene files
│   │   ├── {projectId}/
│   │   │   ├── {sceneId}.glb
│   │   │   └── {sceneId}_thumb.jpg
│   │   └── ...
│   ├── panoramas/              # 360° images
│   │   ├── {projectId}/
│   │   │   ├── {panoramaId}.jpg
│   │   │   ├── {panoramaId}_stereo.jpg
│   │   │   └── {panoramaId}_thumb.jpg
│   │   └── ...
│   ├── textures/               # Material textures
│   │   ├── {materialId}/
│   │   │   ├── albedo.jpg
│   │   │   ├── normal.jpg
│   │   │   ├── roughness.jpg
│   │   │   └── ...
│   │   └── ...
│   ├── branding/               # Company logos
│   │   └── logo.{ext}
│   └── temp/                   # Chunked upload temp storage
│       └── {uploadId}/
│           ├── chunk_0
│           ├── chunk_1
│           └── ...
└── backups/                    # Database backups
    └── ...
```

### File Size Limits

| File Type | Max Size | Chunk Size | Notes |
|-----------|----------|------------|-------|
| GLB | 1GB | 10MB | Chunked upload required |
| Panorama | 50MB | Single | JPEG/PNG/WebP |
| Texture | 20MB | Single | Power-of-2 dimensions preferred |
| Logo | 5MB | Single | PNG/SVG preferred |
| Audio | 20MB | Single | MP3/WAV/OGG |

### Cleanup Strategy

- Temp chunks: Delete after 24 hours if upload not completed
- Orphaned files: Weekly job to check for files not in database
- Deleted content: Immediate deletion (no soft delete for files)

---

## Security Model

### Authentication

- **Method**: Session-based with HTTP-only cookies
- **Token**: Cryptographically random string (32 bytes)
- **Expiration**: 7 days, refreshed on activity
- **Storage**: Database (Session table)

### Authorization

| Resource | Public | Authenticated | Owner Only |
|----------|--------|---------------|------------|
| Published project (no password) | Read | Read | Full |
| Published project (with password) | Read* | Read* | Full |
| Unpublished project | - | - | Full |
| Materials | - | Read own | Full own |
| Branding settings | Read | Read | Update |

*Requires password verification

### Input Validation

- All inputs validated with Zod schemas
- File MIME types verified (magic bytes, not just extension)
- File sizes checked before and during upload
- Filenames sanitized (alphanumeric + limited symbols)

### Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

Note: CSP allows 'wasm-unsafe-eval' for Three.js DRACO decoder.

### Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| File upload | 10 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Public viewing | 60 requests | 1 minute |

---

## Performance Considerations

### Large File Handling

**Problem**: GLB files up to 1GB

**Solutions**:
1. **Chunked Upload**: 10MB chunks, resumable
2. **Streaming Response**: HTTP Range requests for GLB serving
3. **Progressive Loading**: Three.js loads geometry before textures
4. **Compression**: DRACO for geometry (optional server-side processing)

### Three.js Optimization

1. **Frustum Culling**: Don't render off-screen objects
2. **LOD (Level of Detail)**: Future - generate lower-poly versions
3. **Instancing**: For repeated objects (furniture sets)
4. **Texture Compression**: KTX2/Basis format for GPU-compressed textures
5. **Memory Management**: Dispose unused geometries/textures

### Database Performance

1. **Indexes**: On all foreign keys and frequently queried fields
2. **Connection Pooling**: Prisma default + tuning for concurrent users
3. **Query Optimization**: Select only needed fields, avoid N+1

### Caching Strategy

| Layer | What | TTL |
|-------|------|-----|
| Browser | Static assets | 1 year (versioned) |
| Service Worker | App shell | Until update |
| TanStack Query | API responses | 5 minutes |
| Server | N/A (stateless) | - |

---

## Development Phases

### Phase 1: Project Foundation
- New folder structure
- TypeScript configuration
- ESLint + Prettier setup
- Base dependencies
- Development environment

### Phase 2: Database & Backend Core
- Prisma schema (full redesign)
- Database migrations
- Core API structure
- Chunked upload system
- Authentication (simplified)
- Error handling
- Logging

### Phase 3: Scene Viewer
- React Three Fiber setup
- GLB loading with progress
- First-person controls
- Object selection (ray-casting)
- Camera system
- Basic UI (loading, controls)

### Phase 4: Material System
- Material library UI
- Material editor (create/edit)
- MeshPhysicalMaterial integration
- Apply material to object
- Material mappings API
- Texture upload

### Phase 5: VR Mode
- WebXR session management
- VR locomotion (teleport)
- VR object selection
- VR UI panels
- Fallback for non-VR

### Phase 6: PWA & Offline
- Service worker setup
- IndexedDB storage layer
- Offline detection
- Selective scene caching
- Background sync
- Install prompt

### Phase 7: Panorama Viewer
- Rewrite with R3F (or keep A-Frame isolated)
- Fix existing bugs
- Hotspot system
- Stereo VR support
- Integration with project system

### Phase 8: Ozone Integration Prep
- Extract shared types to package
- Align patterns with Ozone
- Document integration points
- Prepare monorepo migration

---

## Glossary

| Term | Definition |
|------|------------|
| **GLB** | Binary glTF format - efficient 3D file format containing geometry, textures, and materials |
| **glTF** | GL Transmission Format - open standard for 3D assets |
| **R3F** | React Three Fiber - React renderer for Three.js |
| **WebXR** | Web API for VR and AR experiences in the browser |
| **Navmesh** | Navigation mesh - simplified geometry defining walkable areas |
| **Ray-casting** | Technique to detect what object a line (ray) intersects |
| **DRACO** | Google's geometry compression library |
| **KTX2** | Khronos texture format with GPU compression |
| **PWA** | Progressive Web App - web app with native-like capabilities |
| **IndexedDB** | Browser database for storing large amounts of structured data |
| **Service Worker** | Script that runs in background, enables offline functionality |
| **MeshPhysicalMaterial** | Three.js material with physically-based rendering (PBR) |
| **Equirectangular** | Projection format for 360° panoramic images |
| **Stereo** | Side-by-side format for VR viewing (left/right eye) |
| **Hotspot** | Interactive point in panorama that triggers action |
| **Spawn Point** | Initial position/rotation when entering a scene |
| **Chunked Upload** | Uploading large files in smaller pieces |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-02 | Use React Three Fiber instead of A-Frame | Better programmatic control, TypeScript support, React ecosystem integration |
| 2026-02-02 | Keep Express.js instead of migrating to Next.js API routes | Simpler deployment, file upload handling, eventual Ozone alignment |
| 2026-02-02 | Remove team management | Not needed for target use case, simplifies codebase |
| 2026-02-02 | 10MB chunk size for uploads | Balance between progress feedback and overhead |
| 2026-02-02 | Session-based auth instead of JWT | Simpler, can invalidate server-side, aligns with current implementation |
| 2026-02-02 | Keep panorama viewer as secondary feature | Backward compatibility, some users may prefer simpler format |
| 2026-02-02 | MeshPhysicalMaterial as standard | Covers all material types needed for interior design |

---

## Document Maintenance

This document should be updated when:
- Major architectural decisions are made
- New phases are added or existing phases change significantly
- Technology choices change
- New integrations are planned

Each phase has its own detailed document in `/docs/phases/`.

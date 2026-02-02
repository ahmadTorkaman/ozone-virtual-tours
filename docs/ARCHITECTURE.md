# Ozone Studio - Architecture Document

> **Version**: 2.0 (Tauri Desktop App)
> **Last Updated**: 2024
> **Status**: Planning Phase

---

## Executive Summary

Ozone Studio is a **native desktop application** for interior designers to view, customize, and present 3D scenes and 360° panoramas. Built with Tauri, it combines web technologies (React, Three.js) with native performance (Rust) for a true offline-first experience.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| App Framework | Tauri 2.0 | Small bundle (~10MB), native file access, cross-platform |
| Frontend | React + TypeScript + Three.js | Familiar stack, excellent 3D support |
| Backend | Rust (minimal) | File I/O, SQLite, system APIs only |
| Database | SQLite (local) | No server needed, true offline |
| Cloud Sync | Optional, custom backend | User choice, not required |
| File Storage | `Documents/Ozone Studio/` | User accessible, easy backup |
| VR Strategy | WebXR (v1.0), Native OpenXR (v2.0) | Ship fast, optimize later |
| Auth | License key system | B2B friendly, no accounts required |
| Distribution | Direct download | No store fees, full control |
| Primary Platform | Windows | Target audience, iOS/Android later |

---

## What Changed (Web → Desktop)

| Aspect | Before (Web PWA) | After (Tauri Desktop) |
|--------|------------------|----------------------|
| Runtime | Browser | Native app + WebView |
| Storage | IndexedDB (limited, can be evicted) | Local files (unlimited) |
| Database | PostgreSQL (cloud) | SQLite (local) |
| File Access | Chunked upload to server | Direct file system |
| Offline | PWA with caching limits | 100% offline by default |
| Distribution | URL access | Installer download |
| Updates | Instant (refresh) | Auto-updater |
| Bundle Size | N/A (web) | ~10-15MB |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           OZONE STUDIO                                  │
│                         (Tauri 2.0 App)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND (WebView)                             │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │  │
│  │  │   React 18  │  │  Three.js   │  │     State Management    │   │  │
│  │  │ + TypeScript│  │ + R3F + XR  │  │  Zustand + TanStack Q   │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │                    Tauri API Bridge                         │ │  │
│  │  │         invoke('command', { args }) ←→ Rust Backend         │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    BACKEND (Rust/Native)                          │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │  │
│  │  │   SQLite    │  │ File System │  │    System APIs          │   │  │
│  │  │  Database   │  │   Access    │  │  Dialogs, Clipboard     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │              Optional: Cloud Sync Module                    │ │  │
│  │  │         License validation, selective data sync             │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Local File System Structure

All user data is stored in `Documents/Ozone Studio/`:

```
Documents/
└── Ozone Studio/
    ├── database.sqlite              # All metadata and settings
    ├── settings.json                # App preferences (theme, etc.)
    │
    ├── projects/
    │   └── {project-id}/
    │       ├── project.json         # Project metadata cache
    │       ├── scenes/
    │       │   ├── {scene-id}.glb   # 3D scene files (up to 1GB+)
    │       │   └── {scene-id}.thumb.jpg
    │       └── panoramas/
    │           ├── {pano-id}.jpg    # 360° images
    │           └── {pano-id}.thumb.jpg
    │
    ├── materials/
    │   ├── library.json             # Material definitions cache
    │   └── textures/
    │       └── {texture-id}/
    │           ├── albedo.jpg
    │           ├── normal.jpg
    │           ├── roughness.jpg
    │           └── ...
    │
    ├── exports/                     # Exported .ozone packages
    │
    └── logs/                        # Application logs
        └── app.log
```

### Why Documents Folder?

- **User accessible**: Users can find, backup, and manage files
- **No storage limits**: Unlike browser storage
- **Survives app reinstall**: Data persists independently
- **Easy migration**: Copy folder to new computer

---

## Technology Stack

### Frontend (Runs in Tauri WebView)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool, HMR |
| Three.js | 0.160+ | 3D rendering engine |
| React Three Fiber | 8.x | React bindings for Three.js |
| @react-three/drei | 9.x | Useful R3F helpers |
| @react-three/xr | 5.x | WebXR support (VR) |
| Zustand | 4.x | State management |
| TanStack Query | 5.x | Async state (Tauri commands) |
| Tailwind CSS | 3.x | Styling |
| Radix UI | 1.x | Accessible UI primitives |
| Lucide React | latest | Icons |

### Backend (Rust/Tauri)

| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | 2.0 | App framework |
| Rust | 1.75+ | Backend language |
| rusqlite | 0.30+ | SQLite bindings |
| serde | 1.x | JSON serialization |
| serde_json | 1.x | JSON handling |
| tokio | 1.x | Async runtime |
| reqwest | 0.11+ | HTTP client (cloud sync) |
| uuid | 1.x | ID generation |
| chrono | 0.4+ | Date/time handling |
| dirs | 5.x | System directories |

### Cloud Backend (Optional, Phase 6)

| Technology | Purpose |
|------------|---------|
| Hono.js or Axum | API server |
| PostgreSQL | Cloud database |
| S3-compatible | Large file storage (optional) |
| Stripe | License management |

### Development Tools

| Tool | Purpose |
|------|---------|
| pnpm | Package manager |
| ESLint | Linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| cargo test | Rust testing |

---

## Core Features

### F1: Project Management
- Create, rename, delete projects locally
- Import/export projects as `.ozone` files (zip archives)
- Project thumbnail generation
- Recent projects list

### F2: 3D Scene Viewer
- Load GLB/GLTF files of any size (direct from disk)
- First-person navigation (WASD + mouse)
- Orbit controls for inspection mode
- Object selection via raycast
- Scene hierarchy browser
- Environment lighting (HDRI)
- Loading progress indication

### F3: Material System
- Local material library with categories
- Full MeshPhysicalMaterial editor:
  - Core: color, metalness, roughness, opacity
  - Clearcoat, Sheen, Transmission, Iridescence, Anisotropy
  - Texture maps: albedo, normal, roughness, metalness, AO, emissive
- Apply materials to scene objects
- Save material mappings per scene
- Real-time preview sphere

### F4: VR Mode (v1.0 - WebXR)
- WebXR in Tauri's webview
- Works with SteamVR, Quest Link
- Teleport and smooth locomotion
- Controller-based object selection
- Floating UI panels in VR

### F5: VR Mode (v2.0 - Native OpenXR) [Future]
- Direct OpenXR integration in Rust
- Better performance
- Standalone Quest support
- Hand tracking

### F6: Panorama Viewer
- 360° equirectangular image viewing
- Hotspot system (navigation, info, media, links)
- Smooth transitions between panoramas
- Stereo VR support

### F7: Cloud Sync (Optional)
- License key activation
- Sync material library across devices
- Sync project metadata (not GLB files by default)
- Manual GLB upload to cloud (user-controlled)

### F8: Settings & Preferences
- Theme (light/dark)
- Default project location
- VR comfort settings
- Keyboard shortcut customization
- Language (future)

---

## Database Schema (SQLite)

```sql
-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_path TEXT,
    folder_path TEXT NOT NULL,          -- Relative to projects/
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    -- Cloud sync (optional)
    cloud_id TEXT,
    last_synced_at TEXT,
    sync_enabled INTEGER DEFAULT 0
);

CREATE TABLE scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    glb_path TEXT NOT NULL,             -- Relative to project folder
    glb_size INTEGER NOT NULL,
    thumbnail_path TEXT,

    -- Spawn point
    spawn_x REAL DEFAULT 0,
    spawn_y REAL DEFAULT 0,
    spawn_z REAL DEFAULT 0,
    spawn_rot_y REAL DEFAULT 0,         -- Y rotation in radians

    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE panoramas (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_path TEXT NOT NULL,           -- Relative to project folder
    thumbnail_path TEXT,

    initial_yaw REAL DEFAULT 0,
    initial_pitch REAL DEFAULT 0,

    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE hotspots (
    id TEXT PRIMARY KEY,
    panorama_id TEXT NOT NULL REFERENCES panoramas(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('NAVIGATION', 'INFO', 'MEDIA', 'LINK')),

    yaw REAL NOT NULL,
    pitch REAL NOT NULL,

    -- For NAVIGATION type
    target_panorama_id TEXT REFERENCES panoramas(id) ON DELETE SET NULL,

    -- For INFO/MEDIA/LINK types (JSON)
    content TEXT,

    icon TEXT,
    color TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- ============================================
-- MATERIAL SYSTEM
-- ============================================

CREATE TABLE material_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT REFERENCES material_categories(id) ON DELETE SET NULL,
    thumbnail_path TEXT,

    -- All PBR properties stored as JSON for flexibility
    properties TEXT NOT NULL,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    -- Cloud sync
    cloud_id TEXT,
    is_synced INTEGER DEFAULT 0
);

CREATE TABLE material_mappings (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    object_name TEXT NOT NULL,          -- Mesh name in GLB
    created_at TEXT NOT NULL,

    UNIQUE(scene_id, object_name)
);

-- ============================================
-- APP STATE
-- ============================================

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE recent_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    opened_at TEXT NOT NULL,

    UNIQUE(project_id)
);

-- ============================================
-- LICENSE & CLOUD SYNC
-- ============================================

CREATE TABLE license (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Only one row
    license_key TEXT,
    activated_at TEXT,
    expires_at TEXT,
    user_email TEXT,
    features TEXT                           -- JSON array of enabled features
);

CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,              -- 'project', 'material', etc.
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,                   -- 'create', 'update', 'delete'
    payload TEXT NOT NULL,                  -- JSON
    created_at TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_scenes_project ON scenes(project_id);
CREATE INDEX idx_panoramas_project ON panoramas(project_id);
CREATE INDEX idx_hotspots_panorama ON hotspots(panorama_id);
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_material_mappings_scene ON material_mappings(scene_id);
CREATE INDEX idx_recent_projects_opened ON recent_projects(opened_at DESC);
CREATE INDEX idx_sync_queue_created ON sync_queue(created_at);
```

---

## Material Properties Schema

Stored as JSON in `materials.properties`:

```typescript
interface MaterialProperties {
  type: 'PHYSICAL' | 'STANDARD' | 'BASIC';

  // Core PBR
  color: string;              // Hex color "#ffffff"
  metalness: number;          // 0-1
  roughness: number;          // 0-1
  opacity: number;            // 0-1
  transparent: boolean;

  // Clearcoat (car paint, lacquer)
  clearcoat: number;          // 0-1
  clearcoatRoughness: number; // 0-1

  // Sheen (fabric, velvet)
  sheen: number;              // 0-1
  sheenRoughness: number;     // 0-1
  sheenColor: string;         // Hex color

  // Transmission (glass, water)
  transmission: number;       // 0-1
  thickness: number;          // 0-10
  ior: number;                // 1.0-2.5 (index of refraction)

  // Iridescence (soap bubbles, oil slick)
  iridescence: number;        // 0-1
  iridescenceIOR: number;     // 1.0-2.5

  // Anisotropy (brushed metal)
  anisotropy: number;         // -1 to 1
  anisotropyRotation: number; // 0 to PI

  // Texture paths (relative to materials/textures/{materialId}/)
  mapPath?: string;
  normalMapPath?: string;
  roughnessMapPath?: string;
  metalnessMapPath?: string;
  aoMapPath?: string;
  emissiveMapPath?: string;
}
```

---

## Project Folder Structure

```
ozone-studio/
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Entry point, Tauri setup
│   │   ├── lib.rs                # Library exports
│   │   ├── commands/             # Tauri command handlers
│   │   │   ├── mod.rs
│   │   │   ├── projects.rs       # Project CRUD
│   │   │   ├── scenes.rs         # Scene operations
│   │   │   ├── materials.rs      # Material CRUD
│   │   │   ├── panoramas.rs      # Panorama operations
│   │   │   ├── files.rs          # File operations
│   │   │   ├── dialogs.rs        # System dialogs
│   │   │   └── sync.rs           # Cloud sync (optional)
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs     # SQLite connection
│   │   │   ├── migrations.rs     # Schema migrations
│   │   │   └── queries.rs        # SQL queries
│   │   ├── models/               # Rust data structures
│   │   │   ├── mod.rs
│   │   │   ├── project.rs
│   │   │   ├── scene.rs
│   │   │   ├── material.rs
│   │   │   └── panorama.rs
│   │   └── utils/
│   │       ├── mod.rs
│   │       ├── paths.rs          # Path utilities
│   │       └── errors.rs         # Error handling
│   ├── Cargo.toml
│   ├── tauri.conf.json           # Tauri configuration
│   ├── build.rs                  # Build script
│   └── icons/                    # App icons
│
├── src/                          # React frontend
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Root component + routing
│   │
│   ├── components/               # Shared UI components
│   │   ├── ui/                   # Base: Button, Input, Dialog, etc.
│   │   ├── layout/               # Header, Sidebar, Layout
│   │   └── feedback/             # Toast, Loading, Error
│   │
│   ├── features/                 # Feature modules
│   │   ├── projects/
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── CreateProjectDialog.tsx
│   │   │   ├── ProjectSettings.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── scene-viewer/
│   │   │   ├── SceneViewer.tsx       # Main viewer component
│   │   │   ├── SceneCanvas.tsx       # R3F Canvas
│   │   │   ├── SceneLoader.tsx       # GLB loading logic
│   │   │   ├── ObjectHierarchy.tsx   # Scene tree panel
│   │   │   ├── ViewerControls.tsx    # Camera controls
│   │   │   ├── SelectionOutline.tsx  # Selected object highlight
│   │   │   └── index.ts
│   │   │
│   │   ├── materials/
│   │   │   ├── MaterialLibrary.tsx   # Library browser
│   │   │   ├── MaterialEditor.tsx    # Create/edit material
│   │   │   ├── MaterialPreview.tsx   # 3D preview sphere
│   │   │   ├── MaterialCard.tsx      # Grid item
│   │   │   ├── PropertySlider.tsx    # Slider control
│   │   │   ├── ColorPicker.tsx       # Color input
│   │   │   ├── TextureUpload.tsx     # Texture selector
│   │   │   └── index.ts
│   │   │
│   │   ├── panorama/
│   │   │   ├── PanoramaViewer.tsx
│   │   │   ├── PanoramaControls.tsx
│   │   │   ├── PanoramaHotspot.tsx
│   │   │   ├── HotspotEditor.tsx
│   │   │   ├── HotspotModal.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── vr/
│   │   │   ├── VRButton.tsx
│   │   │   ├── VRControls.tsx
│   │   │   ├── VRTeleport.tsx
│   │   │   ├── VRMaterialPanel.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── settings/
│   │       ├── SettingsPanel.tsx
│   │       ├── GeneralSettings.tsx
│   │       ├── VRSettings.tsx
│   │       ├── LicenseManager.tsx
│   │       ├── CloudSyncSettings.tsx
│   │       └── index.ts
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── projectStore.ts
│   │   ├── sceneStore.ts
│   │   ├── materialStore.ts
│   │   ├── panoramaStore.ts
│   │   ├── vrStore.ts
│   │   ├── settingsStore.ts
│   │   └── index.ts
│   │
│   ├── services/                 # External interfaces
│   │   ├── tauri/                # Tauri command wrappers
│   │   │   ├── projects.ts
│   │   │   ├── scenes.ts
│   │   │   ├── materials.ts
│   │   │   ├── panoramas.ts
│   │   │   ├── files.ts
│   │   │   └── index.ts
│   │   └── cloud/                # Cloud API (optional)
│   │       ├── api.ts
│   │       ├── license.ts
│   │       └── sync.ts
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useProject.ts
│   │   ├── useScene.ts
│   │   ├── useMaterials.ts
│   │   ├── usePanorama.ts
│   │   ├── useVR.ts
│   │   └── useSettings.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── project.ts
│   │   ├── scene.ts
│   │   ├── material.ts
│   │   ├── panorama.ts
│   │   ├── settings.ts
│   │   └── index.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── three-helpers.ts      # Three.js utilities
│   │   ├── material-helpers.ts   # Material conversion
│   │   ├── format.ts             # Formatting (dates, sizes)
│   │   └── id.ts                 # ID generation
│   │
│   └── styles/
│       └── globals.css           # Tailwind + custom styles
│
├── public/
│   └── hdri/                     # Environment maps
│       └── studio.hdr
│
├── docs/
│   ├── ARCHITECTURE.md           # This file
│   └── phases/
│       ├── PHASE-1-TAURI-SETUP.md
│       ├── PHASE-2-DATABASE-STORAGE.md
│       ├── PHASE-3-SCENE-VIEWER.md
│       ├── PHASE-4-MATERIAL-SYSTEM.md
│       ├── PHASE-5-VR-MODE.md
│       ├── PHASE-6-CLOUD-SYNC.md
│       ├── PHASE-7-PANORAMA-VIEWER.md
│       └── PHASE-8-DISTRIBUTION.md
│
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Implementation Phases

| Phase | Name | Key Deliverables |
|-------|------|------------------|
| **1** | Tauri Setup | Project init, Rust structure, SQLite, basic commands |
| **2** | Database & Storage | Full schema, migrations, CRUD commands, file management |
| **3** | Scene Viewer | GLB loading, controls, selection, hierarchy panel |
| **4** | Material System | Library UI, editor, textures, apply to meshes |
| **5** | VR Mode | WebXR integration, locomotion, VR UI |
| **6** | Cloud Sync | License system, custom backend, selective sync |
| **7** | Panorama Viewer | 360° viewer, hotspots, transitions |
| **8** | Distribution | Windows installer, code signing, auto-updater |

Each phase has detailed documentation in `/docs/phases/`.

---

## Communication: Frontend ↔ Backend

### Tauri Commands

Frontend calls Rust via `invoke()`:

```typescript
// Frontend (TypeScript)
import { invoke } from '@tauri-apps/api/core';

// Call a Rust command
const projects = await invoke<Project[]>('list_projects');

// With arguments
const project = await invoke<Project>('get_project', { id: 'abc123' });

// File operations use paths
const scene = await invoke<Scene>('import_scene', {
  projectId: 'abc123',
  sourcePath: 'C:/Users/Me/scene.glb'
});
```

```rust
// Backend (Rust)
#[tauri::command]
fn list_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let conn = state.db.lock().unwrap();
    db::queries::get_all_projects(&conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_project(id: String, state: State<AppState>) -> Result<Project, String> {
    let conn = state.db.lock().unwrap();
    db::queries::get_project(&conn, &id)
        .map_err(|e| e.to_string())
}
```

### Events

Rust can emit events to frontend:

```rust
// Backend - emit progress
app.emit("import-progress", ImportProgress { percent: 50 }).unwrap();
```

```typescript
// Frontend - listen
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<ImportProgress>('import-progress', (event) => {
  setProgress(event.payload.percent);
});
```

---

## Security Considerations

### Local Security
- SQLite database is local (not encrypted by default)
- For sensitive data, consider SQLCipher in future
- License key stored obfuscated, not plain text
- No passwords stored (license key only)

### File Handling
- Validate file types (GLB, images) by magic bytes
- Sanitize file paths to prevent directory traversal
- File size limits configurable in settings

### Cloud Security (When Implemented)
- HTTPS only for all API calls
- License key validated server-side
- Rate limiting on API
- No sensitive data in sync payload

### Code Signing
- Windows: Authenticode signature required for no SmartScreen warning
- macOS: Notarization required for Gatekeeper
- See Phase 8 for details

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| App startup | < 2 seconds | Cold start to usable UI |
| GLB load (100MB) | < 3 seconds | Local disk read |
| GLB load (1GB) | < 15 seconds | Depends on disk speed |
| Material apply | < 100ms | Instant feedback |
| VR frame rate | 72+ FPS | WebXR target |
| Memory (idle) | < 150MB | No scene loaded |
| Memory (1GB scene) | < 2.5GB | Large scene loaded |
| Installer size | < 30MB | Compressed |

---

## Versioning & Releases

### Version Scheme
- **Major.Minor.Patch** (e.g., 1.2.3)
- Major: Breaking changes, major features
- Minor: New features, backward compatible
- Patch: Bug fixes

### Release Channels
- **Stable**: Production-ready releases
- **Beta**: Pre-release testing (optional)

### Auto-Update Strategy
- Tauri built-in updater
- Check for updates on startup (configurable)
- User confirms before download
- Differential updates when possible

---

## Future Roadmap

### v1.0 (This Implementation)
- Full offline functionality
- Scene viewer + materials
- VR mode (WebXR)
- Panorama viewer
- Windows distribution

### v1.5
- Cloud sync with custom backend
- License key system
- Material library sharing

### v2.0
- Native OpenXR VR (better performance)
- Standalone Quest support
- iOS/Android via Tauri 2.0

### v3.0
- Plugin system
- AI material suggestions
- Collaborative features
- Render farm integration

---

## Glossary

| Term | Definition |
|------|------------|
| **GLB** | Binary glTF format - 3D file with geometry, textures, materials |
| **glTF** | GL Transmission Format - open standard for 3D assets |
| **Tauri** | Framework for building desktop apps with web frontend + Rust backend |
| **R3F** | React Three Fiber - React renderer for Three.js |
| **WebXR** | Web API for VR/AR in browser/webview |
| **OpenXR** | Native VR/AR API standard |
| **SQLite** | Embedded relational database |
| **PBR** | Physically Based Rendering - realistic material model |
| **MeshPhysicalMaterial** | Three.js advanced PBR material |
| **Equirectangular** | 360° panorama image projection format |
| **Hotspot** | Interactive point in panorama |
| **HDRI** | High Dynamic Range Image - for environment lighting |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-XX | Switch from PWA to Tauri | True offline, no storage limits, native file access |
| 2024-XX | SQLite instead of PostgreSQL | Local-first, no server needed |
| 2024-XX | Minimal Rust backend | Keep logic in TypeScript, Rust only for native APIs |
| 2024-XX | Documents folder for storage | User accessible, easy backup |
| 2024-XX | WebXR for v1.0, OpenXR for v2.0 | Ship faster, optimize later |
| 2024-XX | License key auth | B2B friendly, simpler than accounts |
| 2024-XX | Direct download distribution | No store fees, full control |
| 2024-XX | Windows primary | Target audience, expand later |

---

## Document Maintenance

Update this document when:
- Architectural decisions change
- New phases are added
- Technology choices change
- New integrations are planned

Phase-specific details are in `/docs/phases/`.

# Customer Scene Configurator — Architecture & Design

> **Status:** Planning
> **Priority:** High — takes precedence over Scene Hotspot Views, Material Picking, UVW Mapping
> **Depends on:** Phase 9 UI/UX Redesign (complete)

---

## 1. Product Vision

Design firms publish interactive 3D scenes and panoramas for their customers. Customers scan a QR code, open a web viewer, and can swap materials on specific components the designer has marked as configurable — choosing from a curated list of materials the firm provides.

**Key principles:**
- Designers manage everything from the desktop app (Tauri) — no web dashboard for now
- Customers get a high-quality web experience — no install required
- Published state is a snapshot, not live. Designers re-publish to push updates
- Each firm gets its own branded subdomain

---

## 2. Feature Breakdown

### 2.1 Publish Status (Desktop App)

Each project has two independent publish toggles:
- **Scene Published** — GLB 3D scenes are available to customers
- **Panorama Published** — 360 panoramas are available to customers

The designer cannot edit the published snapshot directly. To update what customers see, the designer modifies the project and re-publishes (bumps `publish_version`).

No publish history is stored — only the latest published version exists.

### 2.2 Configurable Components (Desktop App)

Designers mark specific objects/meshes in a scene as "customer-configurable":
- **Component Groups** — Multiple meshes grouped under one label (e.g., "Kitchen Cabinets" = 12 cabinet meshes that all change together)
- **Allowed Materials** — Per component group, the designer assigns a list of materials the customer can choose from
- **Default Material** — The material shown when the customer first opens the scene
- **Material Thumbnails** — Each material option has a preview thumbnail

Workflow in Scene Editor:
1. Select object(s) → Right-click → "Mark as Configurable"
2. Name the component group (e.g., "Countertop")
3. Assign allowed materials from the project's material library
4. Set default material
5. Repeat for other configurable components

### 2.3 Publish Packaging (Desktop App)

When the designer clicks "Publish":
1. App bundles: GLB scene(s) + material textures + panorama images + configuration manifest (JSON)
2. GLB files are optimized (Draco/meshopt compression, KTX2 texture compression)
3. Package is uploaded to the firm's local file server
4. Metadata (project info, QR mapping, firm ID) is sent to Ozone's backend

### 2.4 Customer Viewer (Web App — Phase C)

A web-based Three.js viewer served from Ozone's servers:

**Entry:** Customer scans QR code → opens `firmname.view.ozonestudio.com/project-slug`

**Lobby/Menu:**
- Shows project name, firm branding (logo watermark + Ozone Studio logo)
- Lists available scenes and panoramas as cards/thumbnails
- Customer picks which scene or panorama to view

**3D Scene Viewer:**
- Loads the published GLB scene
- Configurable components are highlighted/indicated
- Customer taps a configurable component → bottom sheet slides up with material thumbnails
- Customer picks a material → component updates in real-time
- Orbit controls for navigation

**Panorama Viewer:**
- Read-only panorama viewer (simplified version of desktop panorama viewer)
- Navigation between panoramas via hotspots

**Rendering Strategy:**
- **High quality (desktop/capable devices):** Three.js + `three-gpu-pathtracer` via WebGPU — near-photorealistic path-traced rendering
- **Fallback (mobile/weaker devices):** Standard Three.js PBR rendering via WebGL2 — still high quality, runs everywhere
- **Auto-detection:** Check for WebGPU support + GPU capability score, serve appropriate renderer
- Note: Mobile users (QR code scanners) will almost always get the fallback renderer

---

## 3. Architecture

### 3.1 System Components

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Desktop App       │     │   Ozone Backend      │     │   Customer Viewer   │
│   (Tauri + React)   │     │   (Our Servers)      │     │   (Static Web App)  │
│                     │     │                      │     │                     │
│ - Project mgmt      │────▶│ - API (metadata,     │◀────│ - Three.js viewer   │
│ - Scene Editor       │     │   QR mappings,       │     │ - Material swapper  │
│ - Publish workflow   │     │   firm accounts)     │     │ - Panorama viewer   │
│ - Component config   │     │ - Auth / subdomain   │     │ - Lobby/menu        │
│ - Material curation  │     │   routing            │     │ - Auto GPU detect   │
└─────────┬───────────┘     └──────────────────────┘     └──────────┬──────────┘
          │                                                         │
          │  Upload published                      Fetch assets     │
          │  package                                                │
          ▼                                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Firm's Local File Server                            │
│                                                                             │
│   /projects/{project-id}/                                                   │
│     ├── manifest.json        (component config, material mappings)          │
│     ├── scenes/                                                             │
│     │   ├── scene-1.glb      (Draco-compressed)                            │
│     │   └── scene-2.glb                                                     │
│     ├── panoramas/                                                          │
│     │   ├── pano-1.jpg                                                      │
│     │   └── pano-2.jpg                                                      │
│     ├── materials/                                                          │
│     │   ├── marble/                                                         │
│     │   │   ├── albedo.ktx2                                                │
│     │   │   ├── normal.ktx2                                                │
│     │   │   └── thumbnail.webp                                             │
│     │   └── granite/                                                        │
│     │       └── ...                                                         │
│     └── branding/                                                           │
│         └── firm-logo.png                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

**Publishing:**
1. Designer configures components + materials in desktop app
2. Designer clicks "Publish Scene" or "Publish Panorama"
3. Desktop app compresses & packages assets
4. Package uploaded to firm's local file server (configurable URL in settings)
5. Desktop app sends metadata to Ozone backend API:
   - Project ID, name, firm ID
   - Publish version, timestamp
   - File server base URL
   - QR code slug

**Customer Viewing:**
1. Customer scans QR code
2. Browser opens `firmname.view.ozonestudio.com/project-slug`
3. Web app requests project metadata from Ozone backend
4. Backend returns: project info, firm branding, file server URL
5. Web app fetches manifest.json from firm's file server
6. Web app loads scene GLB + material assets from firm's file server
7. Customer interacts with configurable components

### 3.3 Firm's Local File Server

Each design firm hosts their own published assets. This keeps large files (GLB, textures) off Ozone's servers and gives firms control over their data.

**Requirements for the firm's server:**
- Serves static files over HTTPS
- CORS headers configured to allow requests from `*.view.ozonestudio.com`
- Sufficient bandwidth for customer access

**Options we can provide:**
- Documentation for setting up a simple file server (nginx, Caddy)
- A lightweight file server app bundled with Ozone Studio
- Or: optional Ozone-hosted storage as a premium feature (future)

### 3.4 QR Code Generation

- Generated in the desktop app when publishing
- Encodes URL: `https://firmname.view.ozonestudio.com/project-slug`
- Downloadable as PNG/SVG for print materials
- Displayed in Project Detail page after publishing

---

## 4. Data Model

### 4.1 Desktop App (SQLite — additions to existing schema)

```sql
-- Publish status per project
ALTER TABLE projects ADD COLUMN scene_published BOOLEAN DEFAULT 0;
ALTER TABLE projects ADD COLUMN panorama_published BOOLEAN DEFAULT 0;
ALTER TABLE projects ADD COLUMN publish_version INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN published_at TEXT;  -- ISO timestamp
ALTER TABLE projects ADD COLUMN publish_slug TEXT;   -- URL-safe unique slug

-- Firm profile (one row, stored in settings or dedicated table)
CREATE TABLE firm_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    firm_name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,      -- e.g., "acme-design"
    logo_path TEXT,                       -- path to firm logo file
    file_server_url TEXT,                -- e.g., "https://files.acmedesign.com"
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Configurable component groups
CREATE TABLE component_groups (
    id TEXT PRIMARY KEY,                  -- UUID
    project_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    group_name TEXT NOT NULL,             -- e.g., "Kitchen Countertop"
    mesh_names TEXT NOT NULL,             -- JSON array: ["counter_top_1", "counter_top_2"]
    default_material_id TEXT,             -- FK to materials
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (scene_id) REFERENCES scenes(id)
);

-- Allowed materials per component group
CREATE TABLE component_material_options (
    id TEXT PRIMARY KEY,                  -- UUID
    component_group_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (component_group_id) REFERENCES component_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);
```

### 4.2 Ozone Backend (Server-side DB — PostgreSQL or similar)

```sql
-- Firm accounts (linked to desktop app license)
CREATE TABLE firms (
    id UUID PRIMARY KEY,
    firm_name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    license_key TEXT NOT NULL,
    logo_url TEXT,
    file_server_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published projects (metadata only, assets on firm's server)
CREATE TABLE published_projects (
    id UUID PRIMARY KEY,
    firm_id UUID NOT NULL REFERENCES firms(id),
    project_slug TEXT NOT NULL,
    project_name TEXT NOT NULL,
    scene_published BOOLEAN DEFAULT FALSE,
    panorama_published BOOLEAN DEFAULT FALSE,
    publish_version INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    thumbnail_url TEXT,
    UNIQUE(firm_id, project_slug)
);

-- QR code mappings
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY,
    published_project_id UUID NOT NULL REFERENCES published_projects(id),
    qr_url TEXT NOT NULL,               -- full URL encoded in QR
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Publish Manifest (JSON — shipped with assets)

```json
{
    "version": 1,
    "project": {
        "name": "Modern Kitchen Remodel",
        "slug": "modern-kitchen-2024"
    },
    "scenes": [
        {
            "id": "scene-1",
            "name": "Kitchen Overview",
            "file": "scenes/kitchen-overview.glb",
            "thumbnail": "scenes/kitchen-overview-thumb.webp"
        }
    ],
    "panoramas": [
        {
            "id": "pano-1",
            "name": "Living Room 360",
            "file": "panoramas/living-room.jpg",
            "thumbnail": "panoramas/living-room-thumb.webp"
        }
    ],
    "configurableComponents": [
        {
            "id": "comp-1",
            "sceneId": "scene-1",
            "name": "Kitchen Countertop",
            "meshNames": ["counter_top_1", "counter_top_2", "island_top"],
            "defaultMaterialId": "mat-marble-white",
            "materials": [
                {
                    "id": "mat-marble-white",
                    "name": "White Marble",
                    "thumbnail": "materials/marble-white/thumb.webp",
                    "maps": {
                        "albedo": "materials/marble-white/albedo.ktx2",
                        "normal": "materials/marble-white/normal.ktx2",
                        "roughness": "materials/marble-white/roughness.ktx2",
                        "metalness": "materials/marble-white/metalness.ktx2"
                    }
                },
                {
                    "id": "mat-granite-black",
                    "name": "Black Granite",
                    "thumbnail": "materials/granite-black/thumb.webp",
                    "maps": { "..." : "..." }
                }
            ]
        }
    ],
    "branding": {
        "firmName": "Acme Interior Design",
        "firmLogo": "branding/firm-logo.png"
    }
}
```

---

## 5. Implementation Phases

### Phase A: Data Model & Publish Status (Desktop App)
**Scope:** SQLite schema, Rust commands, React UI

1. Add publish columns to projects table + migration
2. Create `component_groups` and `component_material_options` tables
3. Create `firm_profile` table
4. Add Rust/Tauri commands:
   - `toggle_scene_publish`, `toggle_panorama_publish`
   - `create_component_group`, `update_component_group`, `delete_component_group`
   - `add_material_option`, `remove_material_option`, `reorder_material_options`
   - `get_firm_profile`, `update_firm_profile`
5. Update Project Detail page: publish toggle UI, configurable components list
6. Update Scene Editor: "Mark as Configurable" context menu, component config panel
7. QR code generation (using `qrcode` Rust crate or JS library)

### Phase B: Publish Packaging (Desktop App)
**Scope:** Asset bundling, compression, upload

1. GLB optimization pipeline (Draco compression, texture → KTX2)
2. Manifest JSON generation from component config
3. Thumbnail generation for scenes/panoramas
4. Material thumbnail generation
5. Upload to firm's file server (configurable endpoint, simple PUT/POST)
6. Send metadata to Ozone backend API

### Phase C: Customer Viewer (Web App)
**Scope:** Separate web project, deployed on Ozone's servers

1. **Project setup:** Vite + React + Three.js + R3F
2. **Lobby/Menu page:** Project info, scene/panorama cards, firm branding
3. **3D Scene Viewer:**
   - GLB loader with Draco/KTX2 support
   - Configurable component detection + highlight
   - Material swap bottom sheet UI
   - Orbit controls
4. **Rendering engine:**
   - WebGPU path tracer (`three-gpu-pathtracer`) for capable devices
   - WebGL2 PBR fallback for mobile/weaker devices
   - Auto GPU capability detection
5. **Panorama Viewer:** Simplified read-only panorama viewer
6. **Subdomain routing:** `firmname.view.ozonestudio.com` → correct project data
7. **Mobile-first responsive design**

### Phase D: Ozone Backend API (Server)
**Scope:** API server for metadata, routing, firm accounts

1. **Tech stack decision** (Node.js/Express, Rust/Axum, Go, etc.)
2. Firm account registration (tied to desktop license key)
3. Published project metadata API
4. QR code URL resolution
5. Subdomain → firm routing
6. CORS configuration for firm file servers

---

## 6. Key Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Publish semantics | Snapshot, not live | Designers control what customers see, re-publish to update |
| Publish history | Not stored | Simplicity; can add later if needed |
| Customer saves config | Not for now | Reduces scope; can add later |
| Component grouping | Yes, from day one | Essential UX — multiple meshes change together |
| Material thumbnails | Yes | Customers need visual material preview |
| Customer access | QR code → URL | Physical print materials, easy sharing |
| Asset hosting | Firm's local server | Large files stay with firm, Ozone hosts metadata only |
| Backend hosting | Ozone's servers | Central API + static web app |
| Web rendering | Path tracer (WebGPU) + PBR fallback (WebGL2) | Best quality for capable devices, universal fallback |
| GPU detection | Automatic | Check WebGPU support + GPU capability score |
| Branding | Firm logo watermark + Ozone Studio logo | Co-branded experience |
| Firm identity | Own subdomain | Professional appearance |
| Scene navigation | Lobby/menu | Clear entry point for multi-scene projects |
| Material swap UX | Bottom sheet with thumbnails | Mobile-friendly, non-intrusive |
| Desktop management | Only interface for now | No web dashboard yet |
| File format | GLB (not JSON GLTF) | Binary = smaller, Draco/KTX2 compression on top |

---

## 7. Open Items for Later

- [ ] Customer configuration persistence (save material choices)
- [ ] Analytics (view counts, popular materials)
- [ ] Firm web dashboard for managing published projects
- [ ] Ozone-hosted asset storage as premium alternative to firm self-hosting
- [ ] Publish history / versioning
- [ ] Password-protected or time-limited QR links
- [ ] Offline/PWA support for customer viewer
- [ ] Material pricing integration
- [ ] Customer submits configuration for designer review ("order" workflow)

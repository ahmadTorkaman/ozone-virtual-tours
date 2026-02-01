# Phase 8: Ozone Integration Preparation

> **Estimated Scope**: Preparing codebase for Ozone monorepo integration
> **Prerequisites**: Phase 7 complete (all features working)
> **Outputs**: Clean, documented code ready for monorepo migration

---

## Overview

This phase prepares Ozone Studio for integration into the main Ozone monorepo:

1. Extract shared types to align with `@ozone/types`
2. Align coding patterns with Ozone conventions
3. Document integration points
4. Prepare package structure for monorepo
5. Create migration plan

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer for interior designers
- **Current State**: Phase 7 complete (fully functional standalone app)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Ozone Repo**: `C:/Users/Lion/Desktop/ozone`
- **Focus**: Preparing for monorepo integration

### Ozone Tech Stack (for alignment)
- **Frontend**: Next.js 14 (App Router) + React 18
- **3D**: React Three Fiber + Three.js
- **State**: Zustand + TanStack Query
- **UI**: Tailwind CSS + Radix UI
- **Types**: Centralized in `@ozone/types`
- **Build**: pnpm workspaces + Turbo

Read `/docs/ARCHITECTURE.md` for full context.

---

## Task Checklist

### 8.1 Audit Current Types

Review all types in Ozone Studio and map them to Ozone equivalents:

| Ozone Studio Type | Ozone Equivalent | Action |
|-------------------|------------------|--------|
| Material | @ozone/types Material | Extend/align |
| MaterialCategory | @ozone/types MaterialCategory | Align |
| Scene | NEW - Add to @ozone/types | Create |
| Panorama | NEW - Add to @ozone/types | Create |
| Hotspot | NEW - Add to @ozone/types | Create |
| Project | Similar to OzoneProject | Extend |
| User | @ozone/types User | Reuse |

### 8.2 Extract Shared Types

Create `client/src/types/ozone-studio.ts` with types ready for extraction:

```typescript
/**
 * Ozone Studio Types
 *
 * These types are designed to be extracted to @ozone/types
 * when integrating with the Ozone monorepo.
 */

// ============================================
// MATERIALS (extends existing Ozone materials)
// ============================================

export type MaterialType = 'BASIC' | 'STANDARD' | 'PHYSICAL';

/**
 * Full material definition for MeshPhysicalMaterial
 * Extends the basic Ozone material concept with full PBR properties
 */
export interface StudioMaterial {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  type: MaterialType;

  // Core PBR
  color?: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;

  // Clearcoat
  clearcoat: number;
  clearcoatRoughness: number;

  // Sheen
  sheen: number;
  sheenRoughness: number;
  sheenColor?: string;

  // Transmission
  transmission: number;
  thickness: number;
  ior: number;

  // Iridescence
  iridescence: number;
  iridescenceIOR: number;

  // Anisotropy
  anisotropy: number;
  anisotropyRotation: number;

  // Textures
  mapUrl?: string;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  metalnessMapUrl?: string;
  aoMapUrl?: string;
  emissiveMapUrl?: string;

  // Relations
  categoryId?: string;
  userId: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface StudioMaterialCategory {
  id: string;
  name: string;
  order: number;
}

// ============================================
// PROJECTS & SCENES
// ============================================

export interface StudioProject {
  id: string;
  slug: string;
  name: string;
  description?: string;
  thumbnail?: string;

  isPublished: boolean;
  password?: string; // Hashed

  userId: string;

  // Project can have scenes (GLB) and/or panoramas
  scenes: StudioScene[];
  panoramas: StudioPanorama[];

  settings?: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
}

export interface StudioScene {
  id: string;
  name: string;
  description?: string;

  glbUrl: string;
  glbSize: number;
  thumbnail?: string;

  spawnPosition?: Vector3;
  spawnRotation?: Vector3;
  navMeshUrl?: string;

  projectId: string;
  materialMappings: StudioMaterialMapping[];

  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudioMaterialMapping {
  id: string;
  sceneId: string;
  materialId: string;
  objectName: string; // Mesh name in GLB
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PANORAMAS
// ============================================

export interface StudioPanorama {
  id: string;
  name: string;
  description?: string;

  imageUrl: string;
  stereoUrl?: string;
  thumbnailUrl?: string;

  initialYaw: number;
  initialPitch: number;

  projectId: string;
  hotspots: StudioHotspot[];

  order: number;
  createdAt: string;
  updatedAt: string;
}

export type HotspotType = 'NAVIGATION' | 'INFO' | 'MEDIA' | 'LINK';

export interface StudioHotspot {
  id: string;
  type: HotspotType;

  yaw: number;
  pitch: number;

  targetId?: string; // For NAVIGATION
  content?: HotspotContent;

  icon?: string;
  color?: string;

  panoramaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotspotContent {
  title?: string;
  description?: string;
  url?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

// ============================================
// UTILITIES
// ============================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}
```

### 8.3 Create Integration Points Documentation

Create `docs/INTEGRATION.md`:

```markdown
# Ozone Studio Integration Points

This document describes how Ozone Studio integrates with the main Ozone platform.

## Data Flow

### Materials
- Ozone Studio uses the same material concept as Ozone
- Materials created in Ozone can be used in Studio
- Studio adds full MeshPhysicalMaterial properties

### Projects
- Studio Projects can be linked to Ozone Projects via `projectRef`
- When linked, Studio inherits project metadata

### Users
- Studio uses the same User model as Ozone
- Authentication can be shared (Firebase/Supabase)

## API Integration

### Endpoints to Expose
- `GET /api/studio/projects` - List Studio projects
- `GET /api/studio/projects/:id` - Get project with scenes
- `GET /api/studio/materials` - List materials (can filter by category)
- `POST /api/studio/scenes/:id/render` - Request render (future)

### Endpoints to Consume
- `GET /api/projects` - Get Ozone projects (for linking)
- `GET /api/materials` - Get shared material library
- `GET /api/users/me` - Get current user

## Shared Components

### From Ozone to Studio
- Material selector component
- User avatar component
- Notification system
- Theme provider

### From Studio to Ozone
- 3D scene viewer (embed in Ozone)
- Material preview component
- Panorama viewer widget

## Monorepo Structure (Target)

\`\`\`
ozone/
├── packages/
│   ├── types/           # @ozone/types (add Studio types)
│   ├── core/            # @ozone/core
│   ├── web/             # @ozone/web (main app)
│   ├── studio/          # @ozone/studio (this app)
│   │   ├── client/
│   │   ├── server/
│   │   └── package.json
│   └── ...
\`\`\`

## Migration Steps

1. Move Ozone Studio to `packages/studio/`
2. Update imports to use `@ozone/types`
3. Share Zustand stores where applicable
4. Unify authentication
5. Add Studio routes to main Ozone app (or keep separate)
```

### 8.4 Align File Naming Conventions

Ozone uses **camelCase** for all files. Rename files if needed:

```
# Current (if any kebab-case)
scene-viewer.tsx → sceneViewer.tsx
material-editor.tsx → materialEditor.tsx

# Exception: Next.js special files stay as-is
page.tsx, layout.tsx, etc.
```

### 8.5 Align Component Patterns

Ensure components follow Ozone patterns:

```tsx
// Ozone pattern: Props interface named ComponentNameProps
interface SceneViewerProps {
  sceneUrl: string;
  onObjectSelect?: (name: string) => void;
}

// Export as named export (not default, except pages)
export function SceneViewer({ sceneUrl, onObjectSelect }: SceneViewerProps) {
  // ...
}

// Use proper TypeScript generics where applicable
export function MaterialList<T extends StudioMaterial>({ materials }: { materials: T[] }) {
  // ...
}
```

### 8.6 Create Package.json for Monorepo

Update `package.json` files for monorepo compatibility:

Client `client/package.json`:
```json
{
  "name": "@ozone/studio-client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@ozone/types": "workspace:*",
    "@ozone/core": "workspace:*",
    // ... other deps
  }
}
```

Server `server/package.json`:
```json
{
  "name": "@ozone/studio-server",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@ozone/types": "workspace:*",
    // ... other deps
  }
}
```

### 8.7 Document API Contracts

Create `docs/API.md` with full API documentation:

```markdown
# Ozone Studio API

## Authentication

All authenticated endpoints require a session cookie or Bearer token.

## Endpoints

### Projects

#### List Projects
\`GET /api/projects\`

Query params:
- \`published\`: boolean (filter by published status)

Response:
\`\`\`json
{
  "data": [
    {
      "id": "clx...",
      "slug": "my-project",
      "name": "Living Room Design",
      "thumbnail": "/uploads/...",
      "isPublished": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
\`\`\`

#### Get Project
\`GET /api/projects/:slug\`

Response includes scenes and panoramas.

... (continue for all endpoints)
```

### 8.8 Create Migration Script Outline

Create `scripts/migrate-to-monorepo.sh`:

```bash
#!/bin/bash

# Ozone Studio → Ozone Monorepo Migration Script
# This script outlines the steps, but should be run manually

echo "=== Ozone Studio Migration ==="

# 1. Ensure Ozone monorepo is set up
echo "Step 1: Verify Ozone monorepo structure"
# cd /path/to/ozone
# ls packages/

# 2. Create studio package directory
echo "Step 2: Create studio package"
# mkdir -p packages/studio

# 3. Copy files
echo "Step 3: Copy Ozone Studio files"
# cp -r /path/to/ozone-virtual-tours/client packages/studio/
# cp -r /path/to/ozone-virtual-tours/server packages/studio/
# cp -r /path/to/ozone-virtual-tours/docs packages/studio/

# 4. Update package names
echo "Step 4: Update package.json names"
# sed -i 's/@ozone-studio\/client/@ozone\/studio-client/g' packages/studio/client/package.json
# sed -i 's/@ozone-studio\/server/@ozone\/studio-server/g' packages/studio/server/package.json

# 5. Update imports to use @ozone/types
echo "Step 5: Update type imports"
# find packages/studio -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/from "\.\.\/types/from "@ozone\/types/g'

# 6. Add to pnpm-workspace.yaml
echo "Step 6: Update workspace config"
# echo "  - 'packages/studio/*'" >> pnpm-workspace.yaml

# 7. Install dependencies
echo "Step 7: Install dependencies"
# pnpm install

# 8. Run type check
echo "Step 8: Verify types"
# pnpm -F @ozone/studio-client type-check
# pnpm -F @ozone/studio-server type-check

echo "=== Migration Complete ==="
```

### 8.9 Prepare Turbo Configuration

Create `turbo.json` entry for studio (to be added to monorepo):

```json
{
  "pipeline": {
    "@ozone/studio-client#build": {
      "dependsOn": ["@ozone/types#build"],
      "outputs": ["dist/**"]
    },
    "@ozone/studio-server#build": {
      "dependsOn": ["@ozone/types#build"],
      "outputs": ["dist/**"]
    },
    "@ozone/studio-client#dev": {
      "cache": false,
      "persistent": true
    },
    "@ozone/studio-server#dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 8.10 Final Checklist

Before integration:

- [ ] All types extracted and documented
- [ ] File naming follows Ozone conventions
- [ ] Component patterns match Ozone
- [ ] API contracts documented
- [ ] No circular dependencies
- [ ] Tests passing (if any)
- [ ] ESLint passing with Ozone config
- [ ] No hardcoded URLs (use environment variables)
- [ ] Authentication ready to unify
- [ ] Shared components identified

---

## Integration Decision Points

### Option A: Separate App (Current)
- Keep Studio as separate deployment
- Link via API calls
- Share auth via SSO

**Pros**: Simpler, independent deployment, separate scaling
**Cons**: Duplicate code, harder to share components

### Option B: Monorepo Package
- Move to `packages/studio/`
- Share types, components, auth
- Deploy as part of Ozone or separately

**Pros**: Code sharing, unified types, easier maintenance
**Cons**: More complex build, tighter coupling

### Option C: Micro-Frontend
- Keep separate codebase
- Embed Studio viewer in Ozone via iframe or module federation

**Pros**: True independence, can use different tech
**Cons**: Complex integration, performance overhead

### Recommendation

**Option B (Monorepo Package)** is recommended because:
1. Ozone already uses monorepo structure
2. Significant code can be shared (materials, auth)
3. Type safety across packages
4. Unified developer experience

---

## Post-Integration Tasks

After moving to monorepo:

1. **Unify Authentication**
   - Use Ozone's Firebase auth
   - Share session handling

2. **Share Material Library**
   - Materials created in Ozone visible in Studio
   - Two-way sync

3. **Add Studio Link in Ozone UI**
   - "Open in Studio" button on projects
   - Preview widget in project details

4. **Unified Deployment**
   - Single CI/CD pipeline
   - Shared Docker configuration

---

## Verification Checklist

After completing Phase 8, verify:

- [ ] Types are clean and documented
- [ ] API documentation is complete
- [ ] Migration steps are clear
- [ ] No breaking changes needed for existing features
- [ ] Code quality matches Ozone standards

---

## Conclusion

This phase prepares Ozone Studio for seamless integration into the Ozone ecosystem. The actual migration should be performed carefully, with proper testing at each step.

The codebase is now:
- Well-documented
- Type-safe
- Following Ozone conventions
- Ready for monorepo integration

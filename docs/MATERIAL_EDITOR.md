# Ozone Material Editor

The Material Editor is a comprehensive tool for creating, managing, and organizing PBR (Physically Based Rendering) materials for use in 3D scenes within the Ozone Virtual Tours platform.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Material Properties](#material-properties)
- [Texture Maps](#texture-maps)
- [3D Preview](#3d-preview)
- [Category Management](#category-management)
- [Import/Export](#importexport)
- [API Reference](#api-reference)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)

---

## Overview

The Material Editor provides a visual interface for creating materials that can be applied to 3D objects in your virtual tours. Materials are defined using the PBR (Physically Based Rendering) workflow, which produces realistic results by simulating how light interacts with surfaces in the real world.

### Key Concepts

- **PBR Materials**: Use physically-based properties like metalness and roughness
- **Material Library**: Per-user collection of materials stored in the cloud
- **Categories**: Organize materials into logical groups
- **Presets**: Quick-start templates for common material types
- **Textures**: Image-based maps for detailed surface properties

---

## Features

### Material Library Page (`/admin/materials`)

- **Grid View**: Visual card layout showing 3D previews
- **List View**: Compact row layout for managing many materials
- **Search**: Find materials by name or category
- **Category Filter**: Sidebar for filtering by category
- **Sync Status**: Shows last sync time and cloud status
- **Import/Export**: Backup and share material libraries

### Material Editor Modal

- **Frosted Glass UI**: Modern, visually appealing design
- **Real-time Preview**: See changes instantly in 3D
- **Three Tabs**:
  - Properties: Color, metalness, roughness, opacity, emissive
  - Textures: Upload and manage texture maps
  - Presets: Apply pre-configured material templates

### 3D Preview

- **Five Shapes**: Sphere, Cube, Torus, TorusKnot, Plane
- **Ten Environments**: HDR lighting presets
- **Interactive Controls**: Click and drag to rotate
- **Contact Shadows**: Realistic grounding effect

---

## Getting Started

### Accessing the Material Editor

1. Navigate to `/admin` and log in
2. Click **Materials** in the sidebar navigation
3. The Material Library page displays your materials

### Creating a New Material

1. Click **New Material** button
2. The Material Editor modal opens with default values
3. Adjust properties using the sliders and inputs
4. Give your material a name
5. Select a category
6. Click **Save Material**

### Using Presets

1. Click **New Material** > **Sparkles icon** (preset dropdown)
2. Select a preset (e.g., Chrome, Gold, Rubber)
3. The editor opens with preset values applied
4. Customize as needed and save

---

## Material Properties

### Base Properties

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `name` | string | - | Display name for the material |
| `category` | string | - | Category for organization |
| `color` | hex | #000000-#ffffff | Base/albedo color |

### PBR Properties

| Property | Type | Range | Default | Description |
|----------|------|-------|---------|-------------|
| `metalness` | float | 0-1 | 0 | How metallic the surface appears. Metals reflect light differently than non-metals. |
| `roughness` | float | 0-1 | 0.5 | Surface micro-roughness. 0 = mirror-like, 1 = completely diffuse |
| `opacity` | float | 0-1 | 1 | Transparency level. Requires `transparent: true` |
| `transparent` | boolean | - | false | Enable transparency rendering |
| `emissive` | hex | - | #000000 | Self-illumination color (glowing) |
| `emissiveIntensity` | float | 0-2 | 0 | Brightness of emission |

### Texture-Related Properties

| Property | Type | Range | Default | Description |
|----------|------|-------|---------|-------------|
| `normalScale` | float | 0-2 | 1 | Intensity of normal map effect |
| `aoIntensity` | float | 0-1 | 1 | Strength of ambient occlusion |
| `displacementScale` | float | 0-1 | 0.1 | Height of displacement mapping |

### Material JSON Structure

```json
{
  "id": "mat_1702648123456_abc123def",
  "name": "Polished Chrome",
  "category": "Metals",
  "color": "#ffffff",
  "metalness": 1,
  "roughness": 0.1,
  "opacity": 1,
  "transparent": false,
  "emissive": "#000000",
  "emissiveIntensity": 0,
  "map": null,
  "normalMap": "/uploads/textures/normal_abc123.png",
  "roughnessMap": null,
  "metalnessMap": null,
  "aoMap": null,
  "heightMap": null,
  "emissiveMap": null,
  "normalScale": 1,
  "aoIntensity": 1,
  "displacementScale": 0.1,
  "createdAt": "2024-12-15T10:00:00.000Z",
  "updatedAt": "2024-12-15T10:30:00.000Z"
}
```

---

## Texture Maps

### Supported Texture Types

| Type | Property | Description | Common Use |
|------|----------|-------------|------------|
| Albedo | `map` | Base color texture | Wood grain, fabric patterns |
| Normal | `normalMap` | Surface detail/bumps | Scratches, surface texture |
| Roughness | `roughnessMap` | Per-pixel roughness | Worn areas, fingerprints |
| Metalness | `metalnessMap` | Per-pixel metallic areas | Painted metal with exposed edges |
| AO | `aoMap` | Ambient occlusion | Crevice shadows, contact darkness |
| Height | `heightMap` | Displacement mapping | 3D surface detail |
| Emissive | `emissiveMap` | Glowing areas | LED indicators, screens |

### Uploading Textures

1. Open the Material Editor
2. Navigate to the **Textures** tab
3. Click **Upload** next to the desired texture type
4. Select an image file (JPEG, PNG, or WebP)
5. The texture is uploaded and applied automatically

### Texture Specifications

- **Format**: JPEG, PNG, or WebP
- **Maximum Size**: 50MB per file
- **Auto-resize**: Images larger than 2048x2048 are automatically resized
- **Output Format**: PNG at 95% quality
- **Recommended Size**: Power of 2 (512, 1024, 2048)

### Removing Textures

Click the **Trash icon** on a texture preview to remove it from the material.

---

## 3D Preview

### Preview Shapes

| Shape | Description | Best For |
|-------|-------------|----------|
| Sphere | Default shape | General materials, metals, glass |
| Cube | Six-sided box | Hard surface materials |
| Torus | Donut shape | Materials with curved surfaces |
| TorusKnot | Complex curves | Testing normal maps |
| Plane | Flat surface | Fabric, floor materials |

### Environment Presets

| Environment | Description |
|-------------|-------------|
| Studio | Neutral lighting, product photography style |
| Sunset | Warm, orange-tinted outdoor lighting |
| Warehouse | Industrial, diffuse lighting |
| Forest | Green-tinted natural lighting |
| Night | Dark environment with subtle lighting |
| City | Urban environment reflections |
| Dawn | Soft morning light |
| Apartment | Interior lighting |
| Lobby | Commercial interior |
| Park | Outdoor green space |

### Preview Controls

- **Click + Drag**: Rotate the preview object
- **Shape Buttons**: Switch between preview shapes
- **Environment Dropdown**: Change lighting environment

---

## Category Management

### Default Categories

The system includes seven default categories:
- **Metals**: Chrome, gold, steel, aluminum
- **Plastics**: Rubber, plastic, PVC
- **Glass**: Clear glass, frosted glass, mirrors
- **Wood**: Natural wood, painted wood, laminate
- **Fabric**: Cotton, leather, velvet
- **Stone**: Marble, granite, concrete
- **Custom**: User-defined materials

### Managing Categories

#### Create a Category
1. In the Materials sidebar, click the **+** button
2. Enter the category name
3. Press Enter or click the checkmark

#### Rename a Category
1. Hover over the category
2. Click the **Edit** (pencil) icon
3. Enter the new name
4. Press Enter or click the checkmark

#### Delete a Category
1. Hover over the category
2. Click the **X** icon
3. Confirm if the category contains materials

---

## Import/Export

### Exporting Materials

1. Click the **Export** button in the toolbar
2. A JSON file is downloaded containing:
   - All materials with properties
   - Category list
   - Export timestamp
   - Version information

### Export File Structure

```json
{
  "version": "1.0",
  "exportedAt": "2024-12-15T10:00:00.000Z",
  "materials": {
    "mat_123": { ... },
    "mat_456": { ... }
  },
  "categories": ["Metals", "Plastics", "Custom"]
}
```

### Importing Materials

1. Click the **Import** button in the toolbar
2. Select a previously exported JSON file
3. Choose import mode:
   - **Merge**: Add new materials, keep existing
   - **Replace**: Replace entire library with imported data
4. Materials are synced to the cloud automatically

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/library` | Fetch user's material library |
| POST | `/api/library/sync` | Sync entire library to cloud |
| GET | `/api/library/material/:id` | Get single material |
| PUT | `/api/library/material/:id` | Create/update material |
| DELETE | `/api/library/material/:id` | Delete material |
| POST | `/api/library/categories` | Update category list |
| POST | `/api/upload/texture` | Upload texture image |

### GET /api/library

Fetches the user's complete material library.

**Response:**
```json
{
  "materials": { ... },
  "categories": ["Metals", "Plastics", ...],
  "lastSyncedAt": "2024-12-15T10:00:00.000Z"
}
```

### POST /api/library/sync

Syncs the entire material library to the cloud.

**Request Body:**
```json
{
  "materials": { ... },
  "categories": [...]
}
```

**Response:**
```json
{
  "success": true,
  "lastSyncedAt": "2024-12-15T10:00:00.000Z",
  "materialCount": 15
}
```

### PUT /api/library/material/:id

Creates or updates a single material.

**Request Body:**
```json
{
  "name": "My Material",
  "category": "Custom",
  "color": "#ff0000",
  "metalness": 0.5,
  "roughness": 0.3
}
```

### POST /api/upload/texture

Uploads a texture image for a material.

**Request (multipart/form-data):**
- `file`: Image file (JPEG, PNG, WebP)
- `textureType`: Type of texture (normal, roughness, ao, etc.)

**Response:**
```json
{
  "success": true,
  "textureUrl": "/uploads/textures/normal_abc123.png",
  "textureType": "normal",
  "metadata": {
    "width": 2048,
    "height": 2048
  }
}
```

---

## Component Architecture

### File Structure

```
client/src/components/admin/material-editor/
├── index.js                 # Component exports
├── MaterialEditor.jsx       # Main editor modal
├── MaterialEditor.css       # Editor styles (frosted glass)
├── MaterialPreview3D.jsx    # R3F 3D preview component
├── MaterialCard.jsx         # Grid card component
├── MaterialCard.css         # Card styles
├── CategoryManager.jsx      # Category sidebar
└── CategoryManager.css      # Category styles
```

### Component Hierarchy

```
Materials.jsx (Page)
├── CategoryManager
│   └── Category items
├── MaterialCard (multiple)
│   └── MaterialPreviewMini
└── MaterialEditor (Modal)
    ├── MaterialPreview3D
    │   └── PreviewShape (Sphere/Cube/etc.)
    ├── Properties Panel
    │   ├── Color pickers
    │   └── Sliders
    ├── Textures Panel
    │   └── TextureUpload (multiple)
    └── Presets Panel
        └── Preset buttons
```

### Key Components

#### MaterialPreview3D
Uses React Three Fiber to render a real-time 3D preview of the material.

**Props:**
- `material`: Material object with PBR properties
- `shape`: Preview shape ('sphere', 'cube', 'torus', 'torusKnot', 'plane')
- `environment`: HDR environment preset name
- `autoRotate`: Enable auto-rotation
- `showControls`: Enable interactive rotation

#### MaterialEditor
Modal component for editing material properties.

**Features:**
- Three-tab interface (Properties, Textures, Presets)
- Real-time preview updates
- Texture upload with drag-and-drop
- Save/delete/duplicate actions

#### CategoryManager
Sidebar component for filtering and managing categories.

**Features:**
- Category list with material counts
- Create/rename/delete categories
- Active category highlighting

---

## State Management

### Material Store (Zustand)

Located at `client/src/stores/materialStore.js`

#### State Shape

```javascript
{
  // Library data
  materials: {},           // Object with material ID keys
  categories: [],          // Array of category names
  lastSyncedAt: null,      // Last sync timestamp

  // Loading states
  isLoading: false,
  isSyncing: false,
  error: null,

  // UI state
  selectedMaterialId: null,
  editingMaterial: null,
  isEditorOpen: false,
  searchQuery: '',
  activeCategory: null,

  // Preview state
  previewShape: 'sphere',
  previewEnvironment: 'studio',
  previewAutoRotate: true
}
```

#### Key Actions

```javascript
// Library management
fetchLibrary()              // Load library from API
syncLibrary()               // Save library to API

// Material CRUD
createMaterial(preset?)     // Create new material
updateMaterial(id, data)    // Update material properties
deleteMaterial(id)          // Delete material
duplicateMaterial(id)       // Clone material
saveMaterial(material)      // Save to API

// Categories
addCategory(name)           // Add new category
removeCategory(name)        // Delete category
renameCategory(old, new)    // Rename category

// UI
openEditor(material?)       // Open editor modal
closeEditor()               // Close editor modal
setSearchQuery(query)       // Filter by search
setActiveCategory(cat)      // Filter by category

// Preview
setPreviewShape(shape)      // Change preview shape
setPreviewEnvironment(env)  // Change lighting
```

#### Using the Store

```javascript
import { useMaterialStore } from '../stores/materialStore';

function MyComponent() {
  const { materials, fetchLibrary, createMaterial } = useMaterialStore();

  useEffect(() => {
    fetchLibrary();
  }, []);

  return (
    <button onClick={() => createMaterial('chrome')}>
      Create Chrome Material
    </button>
  );
}
```

---

## Database Schema

### MaterialLibrary Model

```prisma
model MaterialLibrary {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  materials  Json     @default("{}")  // Material objects stored as JSON
  categories Json     @default("[]")  // Category array

  lastSyncedAt DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
}
```

### Design Decisions

- **JSON Storage**: Materials stored as JSON for flexibility
- **Per-User Libraries**: Each user has their own library
- **Cascade Delete**: Library deleted when user is deleted
- **Sync Tracking**: `lastSyncedAt` tracks cloud sync status

---

## Best Practices

### Material Creation

1. **Start with Presets**: Use presets as starting points
2. **Use Meaningful Names**: Name materials descriptively
3. **Organize with Categories**: Group related materials
4. **Test on Multiple Shapes**: Check appearance on different geometry

### Texture Guidelines

1. **Use Power of 2 Sizes**: 512, 1024, 2048 pixels
2. **Keep File Sizes Small**: Optimize for web delivery
3. **Use Appropriate Formats**: PNG for transparency, JPEG for photos
4. **Test Normal Maps**: Ensure correct orientation

### Performance

1. **Limit Texture Count**: Each texture adds loading time
2. **Use Appropriate Resolution**: Don't use 4K textures for small objects
3. **Optimize Before Upload**: Compress images beforehand
4. **Batch Syncs**: Avoid syncing after every change

---

## Troubleshooting

### Preview Not Loading

- Check browser console for WebGL errors
- Ensure GPU acceleration is enabled
- Try a different browser

### Texture Upload Failed

- Check file size (max 50MB)
- Verify file format (JPEG, PNG, WebP)
- Check network connection

### Sync Not Working

- Verify authentication (login again)
- Check network connection
- Look for error messages in the UI

### Materials Not Appearing

- Refresh the page
- Check category filter (try "All Materials")
- Clear search query

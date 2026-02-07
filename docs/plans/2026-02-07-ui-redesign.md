# UI/UX Redesign — Design Document

**Date:** 2026-02-07
**Status:** Design Complete — Ready for Implementation
**Style Reference:** Figma / Linear — clean, minimal, content-first

---

## Design System

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#101014` | Page background |
| `--bg-surface` | `#16161a` | Panels, sidebars |
| `--bg-raised` | `#1c1c22` | Cards, inputs |
| `--bg-overlay` | `#222228` | Dropdowns, modals |
| `--bg-hover` | `#2a2a32` | Hover states |
| `--border-default` | `#2a2a32` | Structural borders |
| `--border-subtle` | `#222228` | Section dividers |
| `--border-focus` | `#6366f1` | Focus rings |
| `--accent` | `#6366f1` | Indigo — primary action |
| `--text-primary` | `#ececf0` | Headings, labels |
| `--text-secondary` | `#8b8b97` | Body text |
| `--text-tertiary` | `#5c5c66` | Muted, hints |

### Typography
- **Font:** Inter (fallback: system sans-serif)
- **Scale:** 11px (xs), 12px (sm), 13px (base), 14px (lg), 16px (xl), 20px (2xl)
- **Mono:** SF Mono / Fira Code — for inputs, stats, keys

### Radius
- `6px` (sm) — buttons, inputs, tree items
- `8px` (md) — cards, panels
- `12px` (lg) — project cards, modals

### Key Patterns
- Subtle layered backgrounds (base → surface → raised) instead of shadows
- Thin 1px borders, barely visible, structural only
- Indigo accent used sparingly: selected items, active tabs, primary buttons
- Hover states via background shift, not color change
- Scrollbars: 5px, transparent track, subtle thumb

---

## Screens

### 1. Project List (Home)
**File:** `mockups/project-list.html`
**Layout:** Persistent left nav sidebar (220px) + content area

**Left Nav (persistent across non-editor pages):**
- App brand: Ozone Studio logo + name
- Main nav: Projects, Materials (with counts)
- Recent projects (quick access)
- Bottom: What's New, Help, Settings, user card with license status

**Content:**
- Page title + "New Project" primary button
- Toolbar: grid/list view toggle, sort dropdown, expandable search
- Responsive card grid (auto-fill, min 260px)
- Project cards: placeholder thumbnail, scene/pano count badges, name, description (2-line clamp), last modified, file size
- Three-dot context menu on hover
- Dashed "New Project" card
- Keyboard shortcuts bar at bottom

### 2. Project Detail
**File:** `mockups/project-detail.html`
**Layout:** Same persistent nav + content

**Left Nav additions:**
- "This Project" section: Overview, Scenes, Panoramas sub-nav

**Content:**
- Back breadcrumb, editable project title (pencil on hover)
- Project meta: scene/pano counts (color-coded dots), modified date, file size
- Export + more actions
- Tab bar: All / Scenes / Panoramas
- Scene cards: larger, "3D Scene" badge, tri count + object count + size, hover actions
- Panorama cards: compact grid, tinted previews, hotspot count badge (green), resolution
- Dashed import cards for each type (.glb/.gltf, .jpg/.png/.hdr)

### 3. Scene Editor
**File:** `mockups/scene-editor.html`
**Layout:** Full-screen, no persistent nav — header + 3-panel

**Header (46px):**
- Back button + breadcrumb (Ozone > Project > Scene)
- Center toolbar: Move/Rotate/Scale tools, divider, First Person/Orbit camera
- Right: Export, Preview (primary)

**Left Sidebar (260px) — Scene Tree:**
- Panel header: "Scene" + add button
- Search box
- Collapsible tree with groups (Lights, Architecture, Furniture, Props)
- Icons per object type, visibility toggle on hover
- Selected item: indigo muted background

**Center — Viewport:**
- 3D canvas with grid floor visualization
- Stats overlay (FPS, tris, objects)
- Controls hint pill at bottom (WASD, Mouse, Click, Esc)

**Right Panel (280px) — Inspector:**
- Tab bar: Properties | Material
- **Properties tab:** Object info (name, type) + Transform (position, rotation, scale with X/Y/Z axis labels outside inputs)
- **Material tab (pure picker):**
  - "Applied" section: compact row with swatch, name, category, edit link (→ Material Editor), detach button
  - "Library" section: category filter chips, search, hover-to-preview hint, 2-column material cards with swatch + name
  - "+ New" button links to Material Editor

**Status bar (24px):** Ready indicator, object/material/scene counts

### 4. Material Editor
**File:** `mockups/material-editor.html`
**Layout:** Full-screen, 3-panel (300px left, flex center, 320px right)

**Left — Material List:**
- Search + category filters
- Material list items: swatch, name, category
- Hover actions: duplicate, delete

**Center — 3D Preview:**
- Large sphere preview (or cube/plane/cylinder/torus)
- Shape selector bar at bottom
- Environment switcher (Studio, etc.) at top-right

**Right — Properties:**
- General: name, category, Three.js material type selector
- Base: color, opacity, transparent toggle, wireframe toggle, side (front/back/double)
- PBR: roughness, metalness, environment intensity
- Emissive: color, intensity
- Normal: scale
- Displacement: scale, bias
- Texture Maps: 7 drag-and-drop slots (albedo, normal, roughness, metalness, AO, displacement, emissive)

**Header:** Back + breadcrumb, Duplicate button, Save (primary)

### 5. Panorama Viewer
**File:** `mockups/panorama-viewer.html`
**Layout:** Full-screen immersive, no sidebar

**Glassmorphic top bar:**
- Back button, panorama name + counter (e.g., "2 of 8")
- Edit toggle, fullscreen button

**Hotspots (two types):**
- Navigation: white ring with pulse animation, directional arrow, label on hover
- Info: indigo ring with pulse animation, "i" icon, label on hover

**Viewport overlays:**
- Compass (top-right) with north needle
- Zoom +/- buttons (bottom-right)
- Prev/Next circular arrows (centered on sides)

**Bottom bar:**
- Controls hint pill: "Drag to look around | Scroll to zoom | Click hotspots"
- Thumbnail strip: glass background, scrollable, active indicator

**Info panel:** Slides in from right on info hotspot click. Image, text, links. Close button.

**Edit mode:** Toggle via Edit button. Shows floating indicator with pulsing dot.

### 6. Settings
**File:** `mockups/settings.html`
**Layout:** Persistent nav + settings sub-nav (180px) + content

**Sub-nav sections:**
- **General:** Theme, accent color, anti-aliasing, shadow quality, FPS counter, mouse sensitivity, invert Y, projects folder, clear cache
- **License:** License card (tier, status badge, expiry), license key input, feature checklist
- **Shortcuts:** Full keyboard reference (General, Scene Editor, Panorama Viewer)
- **Updates:** Version card, auto-update toggle, update channel (Stable/Beta)
- **About:** Version, platform, framework, renderer, data folder, links

---

## Material Workflow

**Assignment (in Scene Editor):**
1. Select object in viewport or scene tree
2. Switch to Material tab in right panel
3. Hover over library materials → live preview on selected object
4. Click to apply, mouse-out to revert preview

**Editing:**
1. Click pencil icon on applied material → navigates to Material Editor page
2. Or click "+ New" in library → Material Editor with blank material
3. Full PBR editing with live 3D preview on configurable shape
4. Save → material available in library across all projects

**Duplication:**
- Right-click or hover-action on any material → Duplicate
- Creates copy with "(Copy)" suffix, opens in editor

---

## New Feature: Scene Hotspot Views (Preset Camera Perspectives)

Users can set hotspot views within GLB scenes — saved camera positions and orientations that serve as preset perspectives. These can be:
- Linked to panorama navigation (clicking a hotspot in panorama viewer moves to a specific camera angle in the 3D scene)
- Used as named viewpoints (e.g., "Kitchen View", "Entrance View") for quick navigation
- Exported as part of the tour for end-user consumption

This bridges the 3D scene and panorama systems — a hotspot in a panorama can teleport the viewer to a specific camera perspective within a GLB scene.

---

## New Feature: Material Picking from GLB Files

When a user imports a GLB file, the app should detect and extract embedded materials from the model. These materials can then be:
- Listed in the Material tab as "Imported from [model name]"
- Saved to the user's material library for reuse across projects
- Edited in the Material Editor (color, roughness, metalness, textures, etc.)
- Applied to other objects in the same or different scenes

This avoids forcing users to manually recreate materials that already exist in their 3D models.

---

## New Feature: UVW Mapping Solution for Materials

When applying materials from the library to scene objects, the app needs to handle UV mapping properly:
- Detect whether the target mesh has UV coordinates
- If UVs exist: apply the material respecting the existing UV layout
- If UVs are missing or need adjustment: provide UV mapping controls (box/planar/cylindrical/spherical projection)
- Provide per-object texture tiling (repeat U/V) and offset controls in the Properties panel
- Support UV scale/rotation for fine-tuning material placement on surfaces

This ensures materials look correct on any geometry, not just the object they were originally designed for.

# Implementation Todo — UI/UX Redesign

**Created:** 2026-02-07
**Reference:** `docs/plans/2026-02-07-ui-redesign.md`
**Mockups:** `mockups/*.html`

---

## Pre-Implementation

- [ ] **Feature discussion** — Review mockup features vs. existing code. Decide what to implement now vs. later. Many mockup features (transform editing, toolbar tools, etc.) don't exist in the codebase yet and need scoping before implementation.

---

## Design System Foundation

- [ ] Set up design tokens as CSS custom properties / Tailwind config (colors, radii, typography, spacing)
- [ ] Replace Montserrat font with Inter
- [ ] Create shared component primitives: buttons, inputs, toggles, sliders, search boxes
- [ ] Create reusable panel/section components for the inspector pattern

---

## Navigation & Layout

- [ ] Implement persistent left nav sidebar (Projects, Materials, Recent, Settings, user card)
- [ ] Implement sidebar-to-fullscreen transition (nav pages use sidebar, editor/viewer pages go fullscreen)
- [ ] Update React Router structure to support both layouts

---

## Pages

### Project List (Home)
- [ ] Redesign with new card grid layout
- [ ] Add project cards with badges, meta, hover actions, context menu
- [ ] Add dashed "New Project" card
- [ ] Add toolbar: grid/list toggle, sort, search
- [ ] Add keyboard shortcuts bar

### Project Detail
- [ ] Redesign with "This Project" sub-nav in sidebar
- [ ] Add tab bar (All / Scenes / Panoramas)
- [ ] Redesign scene cards with stats and hover actions
- [ ] Redesign panorama cards (compact grid, hotspot badges)
- [ ] Add import cards per type

### Scene Editor
- [ ] Redesign header with breadcrumb + center toolbar + actions
- [ ] Redesign left sidebar as scene tree (collapsible groups, search, visibility toggle)
- [ ] Redesign right panel with Properties / Material tabs
- [ ] Implement Material tab as pure picker (applied material row + library grid)
- [ ] Add category filter chips for materials
- [ ] Implement hover-to-preview material workflow
- [ ] Add status bar
- [ ] Add viewport stats overlay and controls hint

### Material Editor (NEW PAGE)
- [ ] Create new route `/materials/:materialId`
- [ ] Implement left panel: material list with search, categories, hover actions
- [ ] Implement center: 3D preview canvas with shape selector (sphere, cube, plane, cylinder, torus)
- [ ] Implement right panel: full PBR property editor
- [ ] Implement texture map slots with drag-and-drop upload
- [ ] Implement material duplicate workflow
- [ ] Wire up Save/Create flow to backend

### Panorama Viewer
- [ ] Redesign with glassmorphic overlays (top bar, bottom bar)
- [ ] Redesign hotspot rendering (navigation rings, info rings, pulse animation)
- [ ] Add slide-in info panel (from right)
- [ ] Add compass widget
- [ ] Add zoom +/- controls
- [ ] Redesign thumbnail strip with glass effect
- [ ] Add edit mode indicator

### Settings
- [ ] Redesign with sub-navigation (General, License, Shortcuts, Updates, About)
- [ ] Add Appearance settings (theme, accent color)
- [ ] Add Performance settings (AA, shadow quality, FPS counter)
- [ ] Add Controls settings (mouse sensitivity, invert Y)
- [ ] Add Data settings (projects folder, clear cache)
- [ ] Add Shortcuts reference page
- [ ] Add About page with version/platform info

---

## New Features

### Scene Hotspot Views (Preset Camera Perspectives)
- [ ] Design data model for hotspot views (camera position, rotation, FOV, name)
- [ ] Add UI to set/save camera perspective as a hotspot view in the scene editor
- [ ] Add UI to list and navigate between saved hotspot views
- [ ] Link hotspot views to panorama hotspots (bridge between 3D scenes and panoramas)
- [ ] Add backend commands for CRUD on hotspot views
- [ ] Add database schema for hotspot views

### Material System Enhancements
- [ ] Material hover-to-preview in scene editor viewport
- [ ] Material Editor page with full Three.js PBR support
- [ ] Material duplicate & edit workflow
- [ ] Texture slot manager with drag-and-drop
- [ ] Preview shape selector (sphere, cube, plane, cylinder, torus)
- [ ] Environment switcher for material preview

### Material Picking from GLB Files
- [ ] Detect and extract embedded materials when importing GLB files
- [ ] List imported materials in Material tab as "Imported from [model]"
- [ ] Allow saving imported materials to the user's library for reuse
- [ ] Allow editing imported materials in Material Editor

### UVW Mapping for Materials
- [ ] Detect UV coordinates on target meshes
- [ ] Add UV projection modes (box, planar, cylindrical, spherical) for meshes without UVs
- [ ] Add per-object texture tiling (repeat U/V) and offset controls in Properties panel
- [ ] Add UV scale/rotation controls for fine-tuning material placement

---

## Backend (Tauri/Rust)

- [ ] Review if new commands are needed for material CRUD
- [ ] Add hotspot view commands (create, update, delete, list)
- [ ] Add hotspot view database table/schema
- [ ] Review settings commands for new settings fields (theme, accent, performance, controls)

---

## Polish & QA

- [ ] Verify all screens match mockup design tokens
- [ ] Test responsive behavior (panel resizing, grid reflow)
- [ ] Test keyboard navigation and shortcuts
- [ ] Verify dark theme consistency across all screens
- [ ] Performance check: ensure new UI doesn't regress 3D viewport FPS

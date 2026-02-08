# Tasks

> **Product:** Ozone Studio — Native desktop app for interior designers (3D scenes, 360 panoramas, VR)
> **Stack:** Tauri 2.0 (Rust) + React 18 + TypeScript + Three.js/R3F + SQLite
> **Status:** Phase 9 complete. Now: Customer Configurator (Phase 10) + New Features (Phase 11)

## 📊 Roadmap Overview

### Phase 9: UI/UX Redesign ✅
**Goal:** Modern, polished UI matching Figma/Linear aesthetic
**Design:** Complete mockups ready at `docs/plans/2026-02-07-ui-redesign.md`

### Phase 10: Customer Scene Configurator ⬅️ CURRENT
**Goal:** Publish scenes for customer viewing + material configuration
**Design:** `docs/plans/customer-configurator.md`
**Priority:** Highest — takes precedence over other new features

### Phase 11: Advanced Features
**Goal:** Scene hotspot views, material picking from GLB, UVW mapping
**Depends on:** Phase 10 foundation

---

## 🔴 CRITICAL - Design System Foundation

### Design Tokens & Typography
- [x] **Set up design tokens as CSS custom properties / Tailwind config**
  - [x] Colors: bg-base, bg-surface, bg-raised, bg-overlay, bg-hover
  - [x] Borders: border-default, border-subtle, border-focus
  - [x] Accent: indigo #6366f1
  - [x] Text: primary, secondary, tertiary
  - See: `docs/plans/2026-02-07-ui-redesign.md`
- [x] **Replace Montserrat font with Inter**
  - Location: `client/src/index.css`
- [x] **Create shared component primitives**
  - [x] Buttons (primary, secondary, ghost, icon)
  - [x] Inputs, toggles, sliders, search boxes
  - [x] Panel/section components for inspector pattern
  - Create file: `client/src/components/ui/`

### Pre-Implementation
- [x] **Feature discussion** - Review mockup features vs existing code, scope what to implement now vs later
  - See: `docs/TODO.md`

---

## 🟡 HIGH PRIORITY - Navigation & Layout

### App Shell
- [x] **Implement persistent left nav sidebar**
  - [x] App brand: Ozone Studio logo + name
  - [x] Main nav: Projects, Materials (with counts)
  - [x] Recent projects quick access
  - [x] Bottom: What's New, Help, Settings, user card
  - Create file: `client/src/components/layout/Sidebar.tsx`
- [x] **Implement sidebar-to-fullscreen transition**
  - [x] Nav pages use sidebar layout
  - [x] Editor/viewer pages go fullscreen
  - Location: `client/src/App.tsx`
- [x] **Update React Router structure for both layouts**
  - Location: `client/src/App.tsx`

---

## 🟢 MEDIUM - Page Redesigns

### Project List (Home)
- [x] **Redesign with new card grid layout**
  - [x] Project cards with badges, meta, hover actions, context menu
  - [x] Dashed "New Project" card
  - [x] Toolbar: grid/list toggle, sort, search
  - [x] Keyboard shortcuts bar
  - Location: `client/src/pages/ProjectList.tsx`
  - See: `mockups/project-list.html`

### Project Detail
- [x] **Redesign with "This Project" sub-nav**
  - [x] Tab bar (All / Scenes / Panoramas)
  - [x] Redesign scene cards with stats and hover actions
  - [x] Redesign panorama cards (compact grid, hotspot badges)
  - [x] Import cards per type
  - Location: `client/src/pages/ProjectDetail.tsx`
  - See: `mockups/project-detail.html`

### Scene Editor
- [x] **Redesign header with breadcrumb + center toolbar + actions**
  - Location: `client/src/pages/SceneEditor.tsx`
  - See: `mockups/scene-editor.html`
- [x] **Redesign left sidebar as scene tree**
  - [x] Collapsible groups, search, visibility toggle
- [x] **Redesign right panel with Properties / Material tabs**
  - [x] Material tab as pure picker
  - [x] Category filter chips for materials
  - [ ] Hover-to-preview material workflow
- [x] **Add status bar and viewport stats overlay**

### Panorama Viewer
- [x] **Redesign with glassmorphic overlays**
  - [x] Top bar and bottom bar
  - [x] Navigation rings, info rings, pulse animation
  - [x] Slide-in info panel
  - [x] Compass widget, zoom controls
  - [x] Glass effect thumbnail strip
  - Location: `client/src/pages/PanoramaViewerPage.tsx`
  - See: `mockups/panorama-viewer.html`

### Settings
- [x] **Redesign with sub-navigation**
  - [x] General, License, Shortcuts, Updates, About sections
  - [x] Appearance settings (theme, accent color)
  - [x] Performance settings (AA, shadow quality, FPS counter)
  - [x] Controls settings (mouse sensitivity, invert Y)
  - [x] Data settings (projects folder, clear cache)
  - Location: `client/src/pages/Settings.tsx`
  - See: `mockups/settings.html`

---

## 🔴 HIGH PRIORITY - Customer Scene Configurator (Phase 10)

> **Full design:** `docs/plans/customer-configurator.md`

### Phase A: Data Model & Publish Status (Desktop App)
- [ ] **Database schema: publish status columns on projects**
  - [ ] `scene_published`, `panorama_published`, `publish_version`, `published_at`, `publish_slug`
- [ ] **Database schema: `firm_profile` table**
  - [ ] `firm_name`, `subdomain`, `logo_path`, `file_server_url`
- [ ] **Database schema: `component_groups` table**
  - [ ] `group_name`, `mesh_names` (JSON array), `default_material_id`, `sort_order`
- [ ] **Database schema: `component_material_options` table**
  - [ ] `component_group_id`, `material_id`, `sort_order`
- [ ] **Rust/Tauri commands for publish status**
  - [ ] `toggle_scene_publish`, `toggle_panorama_publish`
- [ ] **Rust/Tauri commands for component groups**
  - [ ] `create_component_group`, `update_component_group`, `delete_component_group`
  - [ ] `add_material_option`, `remove_material_option`, `reorder_material_options`
- [ ] **Rust/Tauri commands for firm profile**
  - [ ] `get_firm_profile`, `update_firm_profile`
- [ ] **UI: Publish toggles on Project Detail page**
  - [ ] Separate scene/panorama publish switches
  - [ ] Publish version indicator, published-at timestamp
  - [ ] QR code display + download (PNG/SVG) after publishing
- [ ] **UI: Configurable components panel in Scene Editor**
  - [ ] Right-click object → "Mark as Configurable"
  - [ ] Component group naming, mesh assignment
  - [ ] Material options picker with thumbnails
  - [ ] Default material selection
- [ ] **UI: Firm Profile in Settings**
  - [ ] Firm name, subdomain, logo upload, file server URL

### Phase B: Publish Packaging (Desktop App)
- [ ] **GLB optimization pipeline**
  - [ ] Draco/meshopt compression
  - [ ] Texture → KTX2 conversion
- [ ] **Manifest JSON generation** from component config
- [ ] **Thumbnail generation** for scenes and panoramas
- [ ] **Material thumbnail generation**
- [ ] **Upload to firm's file server** (configurable endpoint)
- [ ] **Send metadata to Ozone backend API**

### Phase C: Customer Viewer (Web App)
- [ ] **Project setup:** Vite + React + Three.js + R3F (separate repo/directory)
- [ ] **Lobby/Menu page**
  - [ ] Project info, scene/panorama cards
  - [ ] Firm logo watermark + Ozone Studio branding
- [ ] **3D Scene Viewer**
  - [ ] GLB loader with Draco/KTX2 support
  - [ ] Configurable component detection + highlight on tap/click
  - [ ] Bottom sheet with material thumbnails for swapping
  - [ ] Orbit controls, mobile touch support
- [ ] **Rendering engine**
  - [ ] WebGPU path tracer (`three-gpu-pathtracer`) for capable devices
  - [ ] WebGL2 PBR fallback for mobile/weaker devices
  - [ ] Auto GPU capability detection + renderer selection
- [ ] **Panorama Viewer** — simplified read-only version
- [ ] **Subdomain routing** (`firmname.view.ozonestudio.com`)
- [ ] **Mobile-first responsive design**

### Phase D: Ozone Backend API (Server)
- [ ] **Tech stack decision** (Node.js, Rust/Axum, Go, etc.)
- [ ] **Firm account registration** (tied to desktop license key)
- [ ] **Published project metadata API**
- [ ] **QR code URL resolution**
- [ ] **Subdomain → firm routing**
- [ ] **CORS configuration for firm file servers**

---

## 🔵 MEDIUM - New Features (Phase 11)

### Material Editor (New Page)
- [x] **Create new route `/materials/:materialId`**
  - [x] Left panel: material list with search, categories
  - [x] Center: 3D preview canvas with shape selector
  - [x] Right panel: full PBR property editor
  - [x] Texture map slots with drag-and-drop upload
  - [x] Material duplicate workflow
  - Location: `client/src/pages/MaterialEditorPage.tsx`
  - See: `mockups/material-editor.html`

### Scene Hotspot Views (Preset Camera Perspectives)
- [ ] **Design data model for hotspot views**
  - [ ] Camera position, rotation, FOV, name
- [ ] **Add UI to set/save camera perspectives**
- [ ] **Link hotspot views to panorama hotspots**
- [ ] **Add backend commands for CRUD**
- [ ] **Add database schema for hotspot views**

### Material Picking from GLB Files
- [ ] **Detect and extract embedded materials when importing GLB**
- [ ] **List imported materials as "Imported from [model]"**
- [ ] **Allow saving imported materials to user library**
- [ ] **Allow editing imported materials in Material Editor**

### UVW Mapping for Materials
- [ ] **Detect UV coordinates on target meshes**
- [ ] **Add UV projection modes** (box, planar, cylindrical, spherical)
- [ ] **Add per-object texture tiling and offset controls**
- [ ] **Add UV scale/rotation controls**

---

## 🎯 STRATEGIC - Backend & Infrastructure

### Tauri/Rust Backend
- [ ] **Review if new commands are needed for material CRUD**
- [ ] **Add hotspot view commands** (create, update, delete, list)
- [ ] **Add hotspot view database table/schema**
- [ ] **Review settings commands for new fields** (theme, accent, performance, controls)

### Distribution
- [ ] **Generate signing keypair** - `cargo tauri signer generate`
  - See: `CLAUDE_SESSION_CONTEXT.md` Phase 8.3
- [ ] **Obtain Windows code signing certificate**
- [ ] **Configure certificate in tauri.conf.json**

---

## 💡 IDEAS (Future Exploration)

- [ ] **3ds Max plugin for Ozone Studio** - Direct export/sync from 3ds Max to Ozone projects
- [ ] **Rhino plugin for Ozone Studio** - Direct export/sync from Rhino to Ozone projects
- [ ] **Install / Uninstall Wizard** - Guided installer and clean uninstaller for end users
- [ ] **Light Settings for Scene Editor** - Configurable lighting (type, intensity, color, position, shadows) for 3D scene viewport

---

## 📅 POLISH & QA

### Visual QA
- [ ] **Verify all screens match design tokens**
- [ ] **Test responsive behavior** (panel resizing, grid reflow)
- [ ] **Test keyboard navigation and shortcuts**
- [ ] **Verify dark theme consistency**
- [ ] **Performance check** - ensure new UI doesn't regress 3D viewport FPS

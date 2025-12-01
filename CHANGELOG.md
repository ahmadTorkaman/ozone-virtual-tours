# Changelog

All notable changes to Ozone Virtual Tours will be documented in this file.

## [Unreleased]

### Phase 3: Tour Builder (Next)
- [ ] Tour editor layout with tabs
- [ ] Floor plan editor with click-to-position
- [ ] Scene management with drag-and-drop
- [ ] Visual hotspot editor
- [ ] Ambient music upload

---

## [0.3.0] - 2024-12-01

### Phase 2: Core Admin Panel

#### Added

- **Frontend Routing**
  - React Router DOM integration with protected routes
  - `AuthContext` for authentication state management
  - `BrandingContext` for global branding settings
  - Public route handling with redirect logic

- **Admin Layout**
  - Responsive sidebar navigation
  - Mobile hamburger menu
  - User info and logout button
  - Gradient branding with Ozone design tokens

- **Authentication System**
  - Invite link-based registration
  - Email login (no password required)
  - Session management with HTTP-only cookies
  - Bootstrap flow for first admin user
  - Auth middleware (`requireAuth`, `requireAdmin`, `optionalAuth`)

- **Auth API Routes**
  - `POST /api/auth/login` - Login with email
  - `POST /api/auth/logout` - End session
  - `GET /api/auth/me` - Get current user
  - `POST /api/auth/invite` - Generate invite link
  - `GET /api/auth/invite/:token` - Validate invite
  - `POST /api/auth/register` - Register with invite
  - `GET /api/auth/bootstrap` - First user setup check

- **Admin Pages**
  - Dashboard with stats and recent tours
  - Tours list with grid view, search, and filters
  - Branding settings with logo upload and color pickers
  - Team settings with invite generation

- **Tour Management**
  - Tour list with publish/unpublish toggle
  - Delete tour with confirmation
  - Copy shareable link functionality
  - Filter by status (All/Published/Draft)

- **Settings API Routes**
  - `GET /api/settings/branding` - Get branding (public)
  - `PUT /api/settings/branding` - Update branding
  - `GET /api/settings/team` - List team members
  - `PUT /api/settings/team/:id` - Update member
  - `DELETE /api/settings/team/:id` - Remove member
  - `GET /api/settings/team/stats` - Team statistics

- **Tour Viewer Updates**
  - Custom slug routing (`/tour/:slug`)
  - Password protection gate
  - Company branding display
  - Loading and error states

- **Updated Tours API**
  - `GET /api/tours/slug/:slug` - Get tour by slug (public)
  - `POST /api/tours/:id/verify-password` - Verify tour password
  - Slug generation and uniqueness validation
  - Password hashing with bcrypt

- **Dependencies**
  - Added `react-router-dom` for client routing
  - Added `cookie-parser` for session cookies

- **API Service Layer**
  - Centralized API calls in `services/api.js`
  - Auth, tours, scenes, hotspots, settings, upload modules

#### Changed

- **App.jsx** - Complete rewrite with React Router
- **Tours routes** - Added auth middleware and slug support
- **Server index.js** - Added auth and settings routes

---

## [0.2.0] - 2024-12-01

### Phase 1: Infrastructure & Docker Setup

#### Added
- **Docker Configuration**
  - `docker-compose.yml` with PostgreSQL, API, and Nginx services
  - `docker-compose.override.yml` for development with hot reload
  - `docker/Dockerfile.server` - Multi-stage Node.js build (dev/prod)
  - `docker/Dockerfile.client` - Vite build with Nginx serving

- **Nginx Configuration**
  - Reverse proxy routing (`/api/*` → Node.js, `/uploads/*` → static)
  - Rate limiting zones for API and uploads
  - SSL configuration (commented, ready for production)
  - Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

- **Environment Setup**
  - `.env.example` - Root environment template
  - `server/.env.example` - Server-specific configuration
  - `.gitignore` - Comprehensive ignore rules

- **Database Schema**
  - `User` model - Team members with roles (ADMIN/EDITOR)
  - `Session` model - Session token management
  - `InviteLink` model - Single-use invite links with expiration
  - `BrandingSettings` model - Company branding configuration

- **Helper Scripts**
  - `scripts/setup-dev.sh` - One-command development setup
  - `scripts/deploy.sh` - Production deployment automation
  - `scripts/backup.sh` - Database and uploads backup

- **Dependencies**
  - Added `bcrypt` for password hashing

#### Changed
- **Tour model** - Added `slug`, `password`, `isPasswordProtected`, `ambientMusicUrl`, `ambientMusicVolume`, `createdById`
- **Hotspot model** - Added `AUDIO` type, `audioUrl`, `audioLoop`, `audioAutoplay` fields
- **Hotspot enum** - Added `AUDIO` to `HotspotType`
- **vite.config.js** - Added `/uploads` proxy and Docker host configuration

---

## [0.1.0] - 2024-12-01

### Initial Commit
- Basic React frontend with A-Frame 360° viewer
- Express.js API with Prisma ORM
- Demo tour with hardcoded data
- Core viewer components (PanoramaViewer, FloorPlanWidget, GuidedTourControls)
- Basic admin components (TourManager, UploadZone)

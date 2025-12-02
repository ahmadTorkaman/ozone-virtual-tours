# Changelog

All notable changes to Ozone Virtual Tours will be documented in this file.

## [Unreleased]

### Future Enhancements
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Custom domain per tour
- [ ] VR headset optimizations

---

## [0.6.0] - 2024-12-02

### Phase 5: Polish & Deployment

#### Added

- **Security Hardening**
  - Rate limiting middleware (`rateLimiter.js`)
    - Auth endpoints: 5 requests/minute
    - Upload endpoints: 10 requests/minute
    - General API: 100 requests/minute
    - Public endpoints: 200 requests/minute
  - File type validation using magic bytes (`fileValidator.js`)
    - Validates actual file content, not just MIME type
    - Sanitizes filenames to prevent directory traversal
  - Applied rate limiting to all API routes
  - Applied file validation to all upload routes

- **Structured Logging**
  - Winston-based logging system (`utils/logger.js`)
  - JSON output for production (log aggregator friendly)
  - Colorized readable output for development
  - Request logging middleware with timing
  - Authentication event logging
  - File rotation for error and combined logs
  - Configurable via LOG_LEVEL environment variable

- **Production Docker Configuration**
  - `docker-compose.prod.yml` with resource limits
  - `nginx.prod.conf` with SSL/HTTPS enabled
  - Memory limits and restart policies
  - JSON file logging with rotation
  - Required environment variable validation

- **Mobile Responsiveness**
  - Added 480px breakpoint for auth pages
  - Verified responsive styles across all components

#### Changed

- **Server index.js** - Integrated request logger and structured error logging
- **Auth routes** - Added authentication event logging
- **Upload routes** - Added magic byte validation to all endpoints
- **.env.example** - Added LOG_LEVEL and LOG_DIR configuration

---

## [0.5.0] - 2024-12-02

### Phase 4: Viewer Enhancement

#### Added

- **Audio State Management**
  - Added audio state to Zustand store (audioEnabled, ambientPlaying, volume, mute)
  - Hotspot audio state tracking
  - Audio actions (enableAudio, toggleAmbientMusic, playHotspotAudio, etc.)

- **AudioPlayer Component (`AudioPlayer.jsx`)**
  - Ambient music playback with loop
  - "Enable Audio" button for browser autoplay policy
  - Play/pause toggle with animated icon
  - Volume slider with hover reveal
  - Mute/unmute toggle
  - Hotspot audio indicator with stop button

- **Branded Loading Screen**
  - Company logo or name display
  - Animated spinner
  - "Loading virtual tour..." text
  - "Powered by" branding footer
  - Fade-in animations

- **Audio Hotspot Support**
  - Play audio when clicking AUDIO type hotspots
  - Loop support per hotspot
  - Stop audio when changing scenes
  - Visual indicator when audio is playing

#### Changed

- **TourViewer.jsx** - Integrated AudioPlayer, audio hotspot handling, branded loading
- **tourStore.js** - Added complete audio state and actions
- **TourViewer.css** - Added branded loading screen styles

---

## [0.4.0] - 2024-12-01

### Phase 3: Tour Builder

#### Added

- **Tour Editor (`TourEditor.jsx`)**
  - Tab-based layout (Details, Floor Plans, Scenes, Preview)
  - Create new and edit existing tours
  - Auto-save status indicator
  - Delete tour with confirmation

- **Tour Details Form (`TourDetailsForm.jsx`)**
  - Basic info: name, slug, description, client, project reference
  - Auto-generate URL-friendly slugs
  - Password protection toggle with password field
  - Ambient music upload with volume slider
  - Viewer settings: auto-rotate, VR mode, compass

- **Floor Plan Editor (`FloorPlanEditor.jsx`)**
  - Upload multiple floor plans
  - Click-to-position scenes on floor plans
  - Scene markers with labels
  - Edit floor plan names
  - Delete floor plans

- **Scene Manager (`SceneManager.jsx`)**
  - Upload 360° panorama images
  - Multi-file upload support
  - Drag-to-reorder scenes
  - Edit scene names
  - Set initial view direction (yaw/pitch)
  - Delete scenes

- **Hotspot Editor (`HotspotEditor.jsx`)**
  - Visual panorama-based editor
  - Click to place hotspots
  - Hotspot types: Navigation, Info, Link, Audio
  - Edit hotspot properties (name, target scene, content, URL)
  - Delete hotspots
  - Position display (yaw/pitch)

- **Tour Preview (`TourPreview.jsx`)**
  - Embedded iframe preview
  - Copy shareable link
  - Open in new tab
  - Tour statistics (scenes, hotspots, floor plans, status)

- **API Routes**
  - `GET/POST /api/tours/:tourId/scenes` - List/create scenes
  - `PUT/DELETE /api/tours/:tourId/scenes/:sceneId` - Update/delete scene
  - `POST /api/tours/:tourId/scenes/reorder` - Reorder scenes
  - `GET/POST /api/tours/:tourId/floorplans` - List/create floor plans
  - `PUT/DELETE /api/tours/:tourId/floorplans/:floorPlanId` - Update/delete
  - `PUT /api/tours/:tourId/floorplans/:floorPlanId/scenes/:sceneId` - Position scene
  - `GET/POST /api/tours/:tourId/scenes/:sceneId/hotspots` - List/create hotspots
  - `PUT/DELETE /api/tours/:tourId/scenes/:sceneId/hotspots/:hotspotId` - Update/delete

- **Upload Routes**
  - `POST /api/upload/audio` - Upload ambient music (MP3, WAV, OGG, WebM)
  - `POST /api/upload/logo` - Upload company logo

- **Updated API Service**
  - `floorPlansApi` - Floor plan CRUD operations
  - Updated `scenesApi` with tour-scoped routes
  - Updated `hotspotsApi` with scene-scoped routes

#### Changed

- **App.jsx** - Added TourEditor routes (`/admin/tours/new`, `/admin/tours/:id`)
- **Server index.js** - Registered floor plans routes
- **Scenes routes** - Added auth middleware, tour-scoped paths
- **Hotspots routes** - Added auth middleware, scene-scoped paths

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

# Ozone Virtual Tours - MVP Roadmap

> **Version:** 1.0
> **Created:** December 2024
> **Last Updated:** December 2024
> **Status:** Planning Complete - Ready for Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technical Architecture](#technical-architecture)
4. [Current State Analysis](#current-state-analysis)
5. [MVP Requirements](#mvp-requirements)
6. [Development Phases](#development-phases)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Post-MVP Backlog](#post-mvp-backlog)
10. [Deployment Guide](#deployment-guide)
11. [Risk Assessment](#risk-assessment)

---

## Executive Summary

### Vision
Transform the Ozone Virtual Tours demo application into a production-ready MVP that enables interior design companies to create, manage, and share immersive 360° virtual tours with their clients.

### Key Objectives
- Enable team members to create and configure virtual tours through a full-featured admin panel
- Allow clients to view tours via shareable public links with optional password protection
- Support ambient music and interactive hotspots for enhanced tour experiences
- Deploy on a self-hosted VPS with Docker for cost-effective, scalable infrastructure

### Target Users
| User Type | Description | Access Method |
|-----------|-------------|---------------|
| **Team Members** | Interior design company staff who create and manage tours | Invite link authentication |
| **Clients** | End customers viewing completed project tours | Public shareable links |

### Business Model
- **Phase 1 (MVP):** Internal tool for a single interior design company (Customer Zero)
- **Phase 2 (Future):** SaaS platform with subscription tiers for multiple companies
- **Integration:** Standalone product with planned future integration into Ozone platform

---

## Project Overview

### Product Description
Ozone Virtual Tours is a web-based platform for creating and sharing interactive 360° virtual tours. The application allows interior design professionals to showcase their completed projects through immersive panoramic experiences, complete with:

- **360° Panoramic Views:** Full spherical image viewing with mouse/touch/gyroscope controls
- **Interactive Hotspots:** Clickable points for navigation, information, media, links, and audio
- **Floor Plan Navigation:** Visual mini-map showing scene positions on architectural floor plans
- **Ambient Music:** Background audio that enhances the tour atmosphere
- **Guided Tours:** Auto-advancing tour mode with progress tracking
- **Mobile Support:** Responsive design for smartphones and tablets
- **VR Ready:** WebXR support for virtual reality headsets (nice-to-have)

### Branding Strategy
Tours will display dual branding:
- **Primary:** Client company branding (e.g., "Lube VR")
- **Secondary:** Platform attribution ("powered by Ozone")

Branding elements are configurable per installation:
- Company name and logo
- Primary and secondary colors
- Custom "powered by" text

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX CONTAINER                            │
│              (Reverse Proxy + SSL Termination)                  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   /api/*        │  │   /uploads/*    │  │   /*            │ │
│  │   → Node.js     │  │   → Static      │  │   → React SPA   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌───────────┐ ┌─────────────────┐
│  NODE.JS API    │ │  STATIC   │ │  REACT FRONTEND │
│  CONTAINER      │ │  FILES    │ │  (Built Assets) │
│                 │ │           │ │                 │
│  Express.js     │ │ /uploads/ │ │  Vite Build     │
│  Prisma ORM     │ │ panoramas │ │  A-Frame        │
│  Passport.js    │ │ audio     │ │  Three.js       │
│                 │ │ floorplans│ │  Zustand        │
└────────┬────────┘ └───────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│   POSTGRESQL    │
│   CONTAINER     │
│                 │
│   Database      │
│   Sessions      │
└─────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.2 | UI Components |
| | Vite | 5.x | Build tool & dev server |
| | A-Frame | 1.4 | 360° WebXR rendering |
| | Three.js | Latest | 3D graphics |
| | Zustand | 4.x | State management |
| **Backend** | Node.js | 18+ | Runtime |
| | Express | 4.x | Web framework |
| | Prisma | 5.7 | ORM & migrations |
| | Passport.js | 0.7 | Authentication |
| | Sharp | Latest | Image processing |
| | Multer | Latest | File uploads |
| **Database** | PostgreSQL | 15 | Primary database |
| **Infrastructure** | Docker | Latest | Containerization |
| | Nginx | Latest | Reverse proxy |
| | Let's Encrypt | - | SSL certificates |
| **VPS** | Ubuntu | Latest | Operating system |
| | 4GB RAM | - | Memory |
| | 2 vCPU | - | Processing |
| | 80GB NVMe | - | Storage |

### Directory Structure

```
ozone-virtual-tours/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # Admin panel components
│   │   │   │   ├── Layout/
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── TourManager/
│   │   │   │   ├── TourEditor/
│   │   │   │   ├── SceneEditor/
│   │   │   │   ├── HotspotEditor/
│   │   │   │   ├── FloorPlanEditor/
│   │   │   │   ├── BrandingSettings/
│   │   │   │   └── TeamSettings/
│   │   │   └── viewer/         # Tour viewer components
│   │   │       ├── PanoramaViewer.jsx
│   │   │       ├── TourHeader.jsx
│   │   │       ├── FloorPlanWidget.jsx
│   │   │       ├── InfoModal.jsx
│   │   │       ├── GuidedTourControls.jsx
│   │   │       ├── SceneThumbnails.jsx
│   │   │       ├── AudioPlayer.jsx
│   │   │       └── PasswordGate.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── viewer/
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   └── package.json
├── server/                     # Node.js Backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── tours.js
│   │   │   ├── scenes.js
│   │   │   ├── hotspots.js
│   │   │   ├── upload.js
│   │   │   ├── auth.js
│   │   │   └── settings.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── services/
│   │   │   ├── imageProcessor.js
│   │   │   ├── audioProcessor.js
│   │   │   └── storageCleanup.js
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
├── docker/                     # Docker configuration
│   ├── nginx/
│   │   └── nginx.conf
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── docker-compose.yml
├── docs/                       # Documentation
│   ├── MVP_ROADMAP.md
│   └── API.md
├── scripts/                    # Utility scripts
│   ├── backup.sh
│   └── deploy.sh
└── shared/                     # Shared code
    └── types.js
```

---

## Current State Analysis

### Implemented Features

| Component | Status | Completeness | Notes |
|-----------|--------|--------------|-------|
| **360° Viewer** | ✅ Working | 90% | A-Frame integration complete |
| **Hotspot System** | ✅ Working | 85% | 4 types implemented (Navigation, Info, Media, Link) |
| **Floor Plan Widget** | ✅ Working | 80% | Display works, needs positioning editor |
| **Guided Tour Mode** | ✅ Working | 90% | Auto-advance with progress tracking |
| **Scene Navigation** | ✅ Working | 90% | Thumbnails and transitions |
| **VR Support** | ⚠️ Partial | 60% | WebXR ready, needs testing |
| **Backend API** | ✅ Working | 85% | Full CRUD, file uploads |
| **Database Schema** | ✅ Working | 95% | Well-designed, needs updates |
| **Admin - Tour List** | ⚠️ Partial | 40% | Display only, no CRUD UI |
| **Admin - Tour Editor** | ❌ Missing | 0% | Not implemented |
| **Admin - Hotspot Editor** | ❌ Missing | 0% | Not implemented |
| **Authentication** | ❌ Missing | 0% | Not implemented |
| **Frontend-API Integration** | ❌ Missing | 0% | Uses hardcoded demo data |
| **Branding System** | ❌ Missing | 0% | Not implemented |
| **Audio/Music** | ❌ Missing | 0% | Not implemented |
| **Password Protection** | ❌ Missing | 0% | Not implemented |
| **Custom Slugs** | ❌ Missing | 0% | Not implemented |

### Code Quality Assessment

**Strengths:**
- Clean, modular React component architecture
- Well-designed Prisma database schema with proper relationships
- Comprehensive REST API with validation and error handling
- Modern tooling (Vite, ESLint, Prisma)
- Design system tokens for consistent styling

**Areas Requiring Work:**
- Demo data hardcoded in `App.jsx` (lines 12-159)
- State management (Zustand store) not utilized
- Admin UI incomplete (skeleton only)
- No test coverage
- No authentication layer
- No production deployment configuration

---

## MVP Requirements

### Functional Requirements

#### FR-1: Authentication & Team Access
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | System shall support invite link authentication for team members | Must Have |
| FR-1.2 | Invite links shall be single-use and expire after 7 days | Must Have |
| FR-1.3 | Existing team members shall be able to generate invite links | Must Have |
| FR-1.4 | System shall maintain user sessions with secure cookies | Must Have |
| FR-1.5 | Users shall be able to log out and invalidate their session | Must Have |

#### FR-2: Tour Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Team members shall be able to create new tours with name and description | Must Have |
| FR-2.2 | Tours shall have unique, customizable URL slugs | Must Have |
| FR-2.3 | Team members shall be able to edit tour metadata | Must Have |
| FR-2.4 | Team members shall be able to delete tours with all associated data | Must Have |
| FR-2.5 | Tours shall have publish/unpublish toggle | Must Have |
| FR-2.6 | Tours shall support optional password protection | Must Have |
| FR-2.7 | Tours shall support ambient background music upload | Must Have |
| FR-2.8 | Deleting a tour shall clean up all associated files from storage | Must Have |

#### FR-3: Scene Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Team members shall be able to upload panorama images (JPEG, PNG, WebP) | Must Have |
| FR-3.2 | System shall auto-generate thumbnails from uploaded panoramas | Must Have |
| FR-3.3 | Team members shall be able to name and describe scenes | Must Have |
| FR-3.4 | Team members shall be able to reorder scenes via drag-and-drop | Must Have |
| FR-3.5 | Team members shall be able to delete scenes | Must Have |

#### FR-4: Floor Plan Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Team members shall be able to upload floor plan images | Must Have |
| FR-4.2 | Team members shall be able to position scenes on floor plans by clicking | Must Have |
| FR-4.3 | Scene markers shall be draggable on the floor plan | Must Have |
| FR-4.4 | Multiple floor plans shall be supported per tour (different floors/levels) | Should Have |

#### FR-5: Hotspot Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Team members shall be able to add hotspots by clicking on the panorama | Must Have |
| FR-5.2 | Hotspots shall support Navigation type (jump to another scene) | Must Have |
| FR-5.3 | Hotspots shall support Info type (display text popup) | Must Have |
| FR-5.4 | Hotspots shall support Media type (display image/video) | Must Have |
| FR-5.5 | Hotspots shall support Link type (open external URL) | Must Have |
| FR-5.6 | Hotspots shall support Audio type (play sound effect) | Must Have |
| FR-5.7 | Team members shall be able to customize hotspot icons and colors | Should Have |
| FR-5.8 | Team members shall be able to edit and delete existing hotspots | Must Have |

#### FR-6: Tour Viewing
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Clients shall access tours via custom slug URLs | Must Have |
| FR-6.2 | Password-protected tours shall prompt for password before viewing | Must Have |
| FR-6.3 | Viewer shall display company branding (logo, name) | Must Have |
| FR-6.4 | Viewer shall display "powered by Ozone" attribution | Must Have |
| FR-6.5 | Viewer shall play ambient music with play/pause controls | Must Have |
| FR-6.6 | Viewer shall be fully responsive on mobile devices | Must Have |
| FR-6.7 | Viewer shall support touch gestures for navigation | Must Have |
| FR-6.8 | Viewer shall support device gyroscope for mobile viewing | Should Have |

#### FR-7: Branding Configuration
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Admin shall be able to configure company name | Must Have |
| FR-7.2 | Admin shall be able to upload company logo | Must Have |
| FR-7.3 | Admin shall be able to set primary and secondary brand colors | Must Have |
| FR-7.4 | Admin shall be able to customize "powered by" text | Should Have |
| FR-7.5 | Branding shall apply to all tours and admin interface | Must Have |

### Non-Functional Requirements

#### NFR-1: Performance
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1.1 | Initial page load time | < 3 seconds |
| NFR-1.2 | Panorama image load time | < 5 seconds (after initial) |
| NFR-1.3 | Scene transition time | < 1 second |
| NFR-1.4 | API response time | < 500ms |
| NFR-1.5 | Concurrent users supported | 50+ viewers |

#### NFR-2: Security
| ID | Requirement |
|----|-------------|
| NFR-2.1 | All traffic shall be encrypted via HTTPS/TLS |
| NFR-2.2 | Tour passwords shall be hashed using bcrypt |
| NFR-2.3 | API shall implement rate limiting |
| NFR-2.4 | File uploads shall be validated for type and size |
| NFR-2.5 | SQL injection prevented via parameterized queries (Prisma) |
| NFR-2.6 | XSS prevented via React's default escaping |

#### NFR-3: Reliability
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-3.1 | System uptime | 99% |
| NFR-3.2 | Database backup frequency | Daily |
| NFR-3.3 | Maximum file upload size | 50MB |
| NFR-3.4 | Graceful error handling | All errors logged |

#### NFR-4: Compatibility
| ID | Requirement |
|----|-------------|
| NFR-4.1 | Support Chrome, Firefox, Safari, Edge (latest 2 versions) |
| NFR-4.2 | Support iOS Safari and Android Chrome |
| NFR-4.3 | Support screen sizes from 320px to 4K |
| NFR-4.4 | Progressive enhancement for older browsers |

---

## Development Phases

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MVP DEVELOPMENT PHASES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1        PHASE 2        PHASE 3        PHASE 4        PHASE 5       │
│  Foundation     Core Admin     Tour Builder   Viewer         Polish        │
│                                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │
│  │ Docker  │   │ Layout  │   │ Floor   │   │ API     │   │ Mobile  │      │
│  │ Setup   │──▶│ & Auth  │──▶│ Plans   │──▶│ Connect │──▶│ Polish  │      │
│  │         │   │         │   │         │   │         │   │         │      │
│  │ Schema  │   │ Tour    │   │ Scenes  │   │ Slugs & │   │ Security│      │
│  │ Updates │   │ CRUD    │   │         │   │ Password│   │         │      │
│  │         │   │         │   │ Hotspot │   │         │   │ Deploy  │      │
│  │         │   │ Brand   │   │ Editor  │   │ Brand   │   │         │      │
│  │         │   │ Settings│   │         │   │ Display │   │         │      │
│  │         │   │         │   │ Music   │   │         │   │         │      │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘      │
│                                                                             │
│  Priority: Get users creating and sharing tours as quickly as possible      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Foundation & Infrastructure

> **Goal:** Establish the technical foundation for development and deployment

#### 1.1 Docker Configuration

**Tasks:**

- [ ] Create `docker-compose.yml` with all services
  ```yaml
  services:
    - postgres (PostgreSQL 15)
    - api (Node.js application)
    - nginx (Reverse proxy)
  ```
- [ ] Create `Dockerfile.server` for Node.js API
  - Multi-stage build for smaller image
  - Production dependencies only
  - Non-root user for security
- [ ] Create `Dockerfile.client` for React build
  - Build stage with Vite
  - Nginx stage for serving static files
- [ ] Configure Docker volumes
  - `postgres_data` - Database persistence
  - `uploads` - User uploaded files
- [ ] Create `nginx.conf` with routing rules
  - `/api/*` → Node.js backend (port 3001)
  - `/uploads/*` → Static file serving
  - `/*` → React SPA with fallback to index.html
- [ ] Configure environment variables
  - `.env.example` template
  - `.env.development` for local dev
  - `.env.production` for deployment
- [ ] Create `docker-compose.override.yml` for development
  - Volume mounts for hot reload
  - Exposed ports for debugging

**Deliverables:**
- Working `docker-compose up` command
- All services starting and communicating
- Development environment with hot reload

#### 1.2 Database Schema Updates

**Tasks:**

- [ ] Create `User` model for authentication
  ```prisma
  model User {
    id          String   @id @default(cuid())
    email       String   @unique
    name        String
    avatar      String?
    role        Role     @default(EDITOR)
    invitedBy   String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }

  enum Role {
    ADMIN
    EDITOR
  }
  ```

- [ ] Create `InviteLink` model
  ```prisma
  model InviteLink {
    id          String   @id @default(cuid())
    token       String   @unique
    email       String?
    createdBy   String
    usedBy      String?
    usedAt      DateTime?
    expiresAt   DateTime
    createdAt   DateTime @default(now())
  }
  ```

- [ ] Create `BrandingSettings` model
  ```prisma
  model BrandingSettings {
    id              String   @id @default(cuid())
    companyName     String
    companyLogo     String?
    primaryColor    String   @default("#7c8cfb")
    secondaryColor  String   @default("#9b72f2")
    poweredByText   String   @default("powered by Ozone")
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
  }
  ```

- [ ] Create `Session` model for authentication
  ```prisma
  model Session {
    id        String   @id @default(cuid())
    userId    String
    token     String   @unique
    expiresAt DateTime
    createdAt DateTime @default(now())
    user      User     @relation(fields: [userId], references: [id])
  }
  ```

- [ ] Update `Tour` model
  ```prisma
  model Tour {
    // ... existing fields ...
    slug                String   @unique
    password            String?  // Hashed
    isPasswordProtected Boolean  @default(false)
    ambientMusicUrl     String?
    ambientMusicVolume  Float    @default(0.5)
    createdById         String?
  }
  ```

- [ ] Update `Hotspot` model
  ```prisma
  enum HotspotType {
    NAVIGATION
    INFO
    MEDIA
    LINK
    AUDIO  // New type
  }

  model Hotspot {
    // ... existing fields ...
    audioUrl      String?
    audioLoop     Boolean @default(false)
    audioAutoplay Boolean @default(false)
  }
  ```

- [ ] Create and run migrations
- [ ] Create seed script for initial data
  - Default branding settings
  - Initial admin user (for development)

**Deliverables:**
- Updated `schema.prisma`
- Migration files
- Seed script

#### 1.3 SSL & Domain Setup

**Tasks:**

- [ ] Configure DNS records for domain
  - A record pointing to VPS IP
  - Optional: www subdomain redirect
- [ ] Install Certbot in Docker setup
- [ ] Configure Nginx for SSL termination
  - HTTP to HTTPS redirect
  - SSL certificate paths
  - Security headers (HSTS, etc.)
- [ ] Set up certificate auto-renewal
  - Certbot renewal cron job
  - Nginx reload after renewal

**Deliverables:**
- HTTPS working on domain
- Auto-renewal configured

---

### Phase 2: Core Admin Panel

> **Goal:** Enable team members to manage tours through a complete admin interface

#### 2.1 Admin Layout & Navigation

**Tasks:**

- [ ] Create `AdminLayout` component
  - Responsive sidebar (collapsible on mobile)
  - Header with user info and logout
  - Main content area
  - Mobile hamburger menu
- [ ] Create navigation structure
  ```
  Dashboard
  Tours
  Branding Settings
  Team Settings
  ```
- [ ] Implement route protection
  - Redirect to login if not authenticated
  - Loading state while checking auth
- [ ] Create admin theme/styling
  - Consistent with Ozone design tokens
  - Dark mode by default
  - Responsive breakpoints

**Deliverables:**
- Working admin shell
- Responsive navigation
- Protected routes

#### 2.2 Invite Link Authentication

**Tasks:**

- [ ] Create auth API routes
  ```
  POST /api/auth/invite          - Generate invite link
  GET  /api/auth/invite/:token   - Validate invite link
  POST /api/auth/register        - Register with invite
  POST /api/auth/login           - Login with email
  POST /api/auth/logout          - Logout
  GET  /api/auth/me              - Get current user
  ```
- [ ] Implement invite link flow
  - Generate unique token (UUID v4)
  - Store with expiration (7 days)
  - Email field optional (for specific invites)
  - Single-use validation
- [ ] Implement session management
  - Secure HTTP-only cookies
  - Session token generation
  - Session validation middleware
- [ ] Create login page
  - Email input
  - "Request Access" for non-users
  - Error messaging
- [ ] Create registration page (from invite)
  - Name input
  - Email (pre-filled if in invite)
  - Avatar upload (optional)
- [ ] Create auth context in React
  - Current user state
  - Login/logout functions
  - Loading state
- [ ] First user bootstrap
  - If no users exist, first visitor can create admin account
  - Subsequent users need invites

**Deliverables:**
- Working invite link system
- Login/register pages
- Session management
- Auth context

#### 2.3 Tour CRUD Operations

**Tasks:**

- [ ] Create Tours list page
  - Grid view with thumbnails
  - List view option
  - Search by name
  - Filter by status (All/Published/Draft)
  - Sort options (Date, Name)
  - Pagination
- [ ] Create "New Tour" modal/page
  - Name input (required)
  - Description textarea
  - Client name input
  - Custom slug input
    - Auto-generate from name
    - Validate uniqueness
    - URL-safe characters only
  - Password protection toggle
    - Password input (shown when enabled)
    - Confirm password
  - Ambient music upload
    - Drag & drop audio file
    - Preview playback
    - Volume slider
  - Create button
- [ ] Create Tour edit page
  - All creation fields editable
  - Publish/Unpublish toggle
  - Copy shareable link button
  - Preview tour button
  - Delete tour button
- [ ] Implement tour deletion
  - Confirmation modal
  - Type tour name to confirm
  - Cascade delete:
    - All scenes
    - All hotspots
    - All uploaded files (panoramas, thumbnails, audio)
  - Show deletion progress
- [ ] Update API routes
  - `GET /api/tours/slug/:slug` - Get tour by slug
  - `POST /api/tours/:id/verify-password` - Verify tour password

**Deliverables:**
- Complete tour management UI
- CRUD operations working
- File cleanup on deletion

#### 2.4 Branding Settings

**Tasks:**

- [ ] Create Branding Settings page
  - Company name input
  - Logo upload with preview
    - Drag & drop or click to upload
    - Image cropping/resizing
    - Preview at different sizes
  - Primary color picker
    - Visual color selector
    - Hex input
    - Preview of color in use
  - Secondary color picker
  - "Powered by" text input
  - Live preview panel
    - Shows how branding appears in viewer
  - Save button
- [ ] Create API routes
  ```
  GET  /api/settings/branding     - Get branding settings
  PUT  /api/settings/branding     - Update branding settings
  POST /api/settings/branding/logo - Upload logo
  ```
- [ ] Implement branding context
  - Load branding on app init
  - Apply CSS variables for colors
  - Make available throughout app

**Deliverables:**
- Branding configuration page
- Logo upload working
- Colors applied to UI

#### 2.5 Team Settings

**Tasks:**

- [ ] Create Team Settings page
  - List of team members
    - Name, email, role
    - Avatar
    - Joined date
  - Invite new member button
    - Generate invite link
    - Copy to clipboard
    - Optional: Send via email
  - Remove member (admin only, future)
- [ ] Display invite links
  - Active invites
  - Expiration date
  - Revoke option

**Deliverables:**
- Team management page
- Invite link generation UI

---

### Phase 3: Tour Builder

> **Goal:** Enable complete tour creation with floor plans, scenes, and hotspots

#### 3.1 Tour Editor Layout

**Tasks:**

- [ ] Create Tour Editor page structure
  - Tab navigation:
    - Details (name, slug, settings)
    - Floor Plans
    - Scenes
    - Preview
  - Sidebar with tour info
  - Save/Publish buttons
  - Unsaved changes warning
- [ ] Implement auto-save
  - Debounced save on changes
  - Save indicator
  - Conflict resolution

**Deliverables:**
- Tour editor shell
- Tab navigation

#### 3.2 Floor Plan Editor

**Tasks:**

- [ ] Create Floor Plan upload section
  - Drag & drop upload zone
  - Multiple floor plans support
  - Floor/level naming
  - Reorder floors
  - Delete floor plan
- [ ] Create Floor Plan viewer
  - Display floor plan image
  - Zoom and pan controls
  - Scene markers overlay
- [ ] Implement scene positioning
  - Click on floor plan to place scene
  - Show placement marker
  - Drag existing markers to reposition
  - Scene name labels on markers
  - Click marker to edit scene
- [ ] Create marker styling
  - Numbered markers
  - Highlight current/selected scene
  - Connection lines between related scenes (optional)
- [ ] Update API
  - `PUT /api/scenes/:id/position` - Update floor plan position

**Deliverables:**
- Floor plan upload working
- Visual scene positioning
- Drag to reposition

#### 3.3 Scene Management

**Tasks:**

- [ ] Create Scene upload section
  - Drag & drop multiple panoramas
  - Upload progress indicator
  - Batch upload support
- [ ] Implement auto-thumbnail generation
  - Crop center portion of panorama
  - Generate 400x200 thumbnail
  - Save to `/uploads/thumbnails/`
- [ ] Create Scene list view
  - Thumbnail preview
  - Scene name (editable)
  - Description (editable)
  - Drag to reorder
  - Delete button
  - "Edit Hotspots" button
  - "Position on Floor Plan" button
- [ ] Implement scene reordering
  - Drag and drop
  - Update order in database
  - Reflect in viewer navigation
- [ ] Create Scene details panel
  - Name input
  - Description textarea
  - Thumbnail preview
  - Floor plan position indicator
  - Hotspot count

**Deliverables:**
- Panorama upload with thumbnails
- Scene management UI
- Drag to reorder

#### 3.4 Hotspot Editor

**Tasks:**

- [ ] Create Hotspot Editor view
  - Full-screen panorama preview
  - Same controls as viewer
  - Edit mode overlay
  - Exit editor button
- [ ] Implement click-to-place
  - Click anywhere on panorama
  - Calculate yaw/pitch from click position
  - Show placement preview marker
  - Open hotspot config modal
- [ ] Display existing hotspots
  - Show all hotspots as icons
  - Different icons per type
  - Hover to show name
  - Click to edit
- [ ] Create Hotspot configuration modal
  - Hotspot type selector (tabs or dropdown)
  - **Navigation type:**
    - Target scene dropdown
    - Transition effect (optional)
  - **Info type:**
    - Title input
    - Content textarea (rich text optional)
  - **Media type:**
    - Image/video URL or upload
    - Caption input
  - **Link type:**
    - URL input
    - "Open in new tab" toggle
    - Link text
  - **Audio type:**
    - Audio file upload
    - Loop toggle
    - Autoplay toggle
    - Volume slider
  - **Common options:**
    - Icon selector (predefined icons)
    - Color picker
    - Scale slider
  - Save/Cancel/Delete buttons
- [ ] Implement hotspot dragging
  - Drag to reposition after placement
  - Update coordinates
- [ ] Create hotspot preview
  - Test hotspot without leaving editor
  - Info popup preview
  - Audio playback preview

**Deliverables:**
- Visual hotspot editor
- All 5 hotspot types working
- Click to place, drag to move

#### 3.5 Ambient Music

**Tasks:**

- [ ] Create ambient music section in tour editor
  - Audio file upload (MP3, WAV, OGG)
  - File size limit: 10MB
  - Preview playback
  - Volume slider (0-100%)
  - Remove audio button
- [ ] Update Tour model with music fields
  - `ambientMusicUrl`
  - `ambientMusicVolume`
- [ ] Create audio upload endpoint
  - `POST /api/upload/audio`
  - Validate audio file types
  - Store in `/uploads/audio/`
- [ ] Implement viewer audio playback
  - Auto-play on tour load (with user interaction requirement)
  - Play/pause button in UI
  - Volume control
  - Loop continuously
  - Persist play state across scenes

**Deliverables:**
- Ambient music upload
- Viewer playback working

---

### Phase 4: Viewer Enhancement

> **Goal:** Connect viewer to real data and implement all viewing features

#### 4.1 API Integration

**Tasks:**

- [ ] Remove hardcoded `DEMO_TOUR` from App.jsx
- [ ] Create tour loading service
  ```javascript
  // services/tourService.js
  export async function getTourBySlug(slug) { ... }
  export async function verifyTourPassword(tourId, password) { ... }
  ```
- [ ] Create Tour Viewer page
  - Route: `/tour/:slug`
  - Fetch tour data on mount
  - Handle loading state
  - Handle not found (404)
  - Handle unpublished (403 or 404)
- [ ] Implement Zustand store integration
  - Replace local state with store
  - Use `useTourStore` throughout components
  - Proper state initialization
- [ ] Add error boundaries
  - Catch rendering errors
  - Show friendly error message
  - Report errors to console

**Deliverables:**
- Viewer loading real tour data
- Zustand state management
- Error handling

#### 4.2 Custom Slug Routing

**Tasks:**

- [ ] Configure React Router for slug-based URLs
  ```
  /tour/:slug        - View tour
  /admin/*           - Admin routes
  /login             - Login page
  /register/:token   - Registration with invite
  ```
- [ ] Create slug validation
  - URL-safe characters only
  - Lowercase enforcement
  - Unique validation
- [ ] Implement slug generation
  - Auto-generate from tour name
  - Handle duplicates (append number)
  - Allow manual customization
- [ ] Create shareable link component
  - Full URL display
  - Copy to clipboard button
  - QR code generation (optional)

**Deliverables:**
- Slug-based tour URLs
- Copy shareable link

#### 4.3 Password Protection

**Tasks:**

- [ ] Create Password Gate component
  - Full-screen overlay
  - Password input
  - Submit button
  - Error message for incorrect password
  - Remember on this device (optional)
- [ ] Implement password verification flow
  1. Load tour metadata (without scenes)
  2. Check if password protected
  3. Show password gate if protected
  4. Verify password via API
  5. Store access token in session
  6. Load full tour data
- [ ] Create API endpoint
  - `POST /api/tours/:id/verify-password`
  - Compare bcrypt hash
  - Return access token or error
- [ ] Handle password in admin
  - Set password when creating/editing tour
  - Change password option
  - Remove password option
  - Show password strength indicator

**Deliverables:**
- Password gate UI
- Verification working
- Secure password storage

#### 4.4 Branding Display

**Tasks:**

- [ ] Fetch branding settings in viewer
  - Load on app initialization
  - Cache in context/store
- [ ] Display company logo in viewer header
  - Responsive sizing
  - Fallback to company name if no logo
- [ ] Apply brand colors
  - Primary color for main elements
  - Secondary color for accents
  - CSS custom properties approach
- [ ] Display "Powered by Ozone" footer
  - Customizable text from settings
  - Subtle, non-intrusive placement
  - Link to Ozone website (optional)
- [ ] Create branded loading screen
  - Company logo
  - Loading spinner with brand colors
  - Tour name display

**Deliverables:**
- Branding visible in viewer
- Colors applied
- Professional loading screen

#### 4.5 Audio Player Integration

**Tasks:**

- [ ] Create AudioPlayer component
  - Play/pause button
  - Volume slider
  - Mute toggle
  - Minimal, non-intrusive design
  - Position in viewer UI
- [ ] Implement audio state management
  - Track playing/paused state
  - Volume level
  - Persist across scenes
- [ ] Handle browser autoplay restrictions
  - Show "Click to enable audio" on first visit
  - Remember user preference
  - Graceful fallback
- [ ] Implement audio hotspot playback
  - Different from ambient music
  - Play on hotspot click
  - Stop when clicking elsewhere
  - Loop if configured

**Deliverables:**
- Ambient music player
- Audio hotspots working
- Browser autoplay handled

---

### Phase 5: Polish & Deployment

> **Goal:** Ensure quality, security, and successful production deployment

#### 5.1 Mobile Responsiveness

**Tasks:**

- [ ] Audit all admin pages for mobile
  - Navigation menu
  - Forms and inputs
  - Tables and lists
  - Modals and dialogs
- [ ] Audit viewer for mobile
  - Touch gestures for panorama control
  - Pinch to zoom
  - Hotspot touch targets (min 44x44px)
  - Floor plan widget sizing
  - Scene thumbnails scrolling
- [ ] Implement device gyroscope
  - Request permission (iOS 13+)
  - Map device orientation to camera
  - Toggle gyroscope on/off
- [ ] Test on actual devices
  - iOS Safari
  - Android Chrome
  - Various screen sizes
- [ ] Fix any responsive issues

**Deliverables:**
- Fully responsive admin
- Fully responsive viewer
- Gyroscope support

#### 5.2 Security Hardening

**Tasks:**

- [ ] Implement rate limiting
  ```javascript
  // Different limits for different routes
  /api/auth/*     - 5 requests/minute
  /api/upload/*   - 10 requests/minute
  /api/*          - 100 requests/minute
  ```
- [ ] Validate all file uploads
  - File type validation (magic numbers)
  - File size limits
  - Filename sanitization
  - Virus scanning (optional)
- [ ] Secure headers via Helmet
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
- [ ] Input sanitization
  - Sanitize HTML in text fields
  - Validate URL formats
  - Escape special characters
- [ ] Audit authentication
  - Session expiration
  - Secure cookie flags
  - CSRF protection
- [ ] Environment variable security
  - No secrets in code
  - Validate required env vars on startup

**Deliverables:**
- Rate limiting active
- Security headers configured
- Input validation complete

#### 5.3 Error Handling & Logging

**Tasks:**

- [ ] Create structured logging
  ```javascript
  // Log format
  {
    timestamp: "2024-01-15T10:30:00Z",
    level: "error",
    message: "Database connection failed",
    context: { ... }
  }
  ```
- [ ] Implement error tracking
  - Catch unhandled exceptions
  - Log with stack traces
  - Alert on critical errors (optional)
- [ ] Create user-friendly error pages
  - 404 Not Found
  - 500 Server Error
  - 403 Forbidden
  - Maintenance mode
- [ ] Add health check endpoint
  - `GET /api/health`
  - Check database connection
  - Check file storage access
  - Return system status

**Deliverables:**
- Structured logging
- Error pages
- Health check endpoint

#### 5.4 Production Deployment

**Tasks:**

- [ ] Finalize Docker configurations
  - Production-optimized builds
  - Resource limits
  - Restart policies
- [ ] Create deployment script
  ```bash
  #!/bin/bash
  # scripts/deploy.sh
  git pull origin main
  docker-compose build
  docker-compose up -d
  docker-compose exec api npx prisma migrate deploy
  ```
- [ ] Set up database backups
  ```bash
  # Daily backup cron job
  0 2 * * * /scripts/backup.sh
  ```
- [ ] Configure production environment
  - Set all env variables
  - Verify SSL certificates
  - Test all endpoints
- [ ] Create rollback procedure
  - Database migration rollback
  - Previous Docker image restoration
- [ ] Perform smoke testing
  - [ ] Create a tour
  - [ ] Upload panoramas
  - [ ] Add hotspots
  - [ ] Set password
  - [ ] View tour via public link
  - [ ] Test mobile viewer
  - [ ] Test audio playback
- [ ] Team onboarding
  - Create first admin account
  - Generate invite links
  - Document login process

**Deliverables:**
- Deployed to production VPS
- Backups configured
- Team onboarded

---

## Database Schema

### Complete Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============================================
// Authentication & Users
// ============================================

model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String
  avatar      String?
  role        Role      @default(EDITOR)
  invitedBy   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  sessions    Session[]
  tours       Tour[]    @relation("CreatedBy")
  invites     InviteLink[] @relation("CreatedInvites")
}

enum Role {
  ADMIN
  EDITOR
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
}

model InviteLink {
  id          String    @id @default(cuid())
  token       String    @unique
  email       String?
  createdById String
  usedById    String?
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())

  createdBy   User      @relation("CreatedInvites", fields: [createdById], references: [id])

  @@index([token])
}

// ============================================
// Branding & Settings
// ============================================

model BrandingSettings {
  id              String   @id @default(cuid())
  companyName     String   @default("Company Name")
  companyLogo     String?
  primaryColor    String   @default("#7c8cfb")
  secondaryColor  String   @default("#9b72f2")
  poweredByText   String   @default("powered by Ozone")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ============================================
// Tours
// ============================================

model Tour {
  id                  String      @id @default(cuid())
  name                String
  slug                String      @unique
  description         String?
  thumbnail           String?
  clientName          String?
  projectRef          String?
  isPublished         Boolean     @default(false)
  isArchived          Boolean     @default(false)
  isPasswordProtected Boolean     @default(false)
  password            String?     // Hashed with bcrypt
  ambientMusicUrl     String?
  ambientMusicVolume  Float       @default(0.5)
  settings            Json?
  createdById         String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  createdBy           User?       @relation("CreatedBy", fields: [createdById], references: [id])
  scenes              Scene[]
  floorPlans          FloorPlan[]

  @@index([slug])
  @@index([isPublished])
  @@index([createdById])
}

model Scene {
  id           String    @id @default(cuid())
  tourId       String
  name         String
  description  String?
  order        Int       @default(0)
  panoramaUrl  String
  stereoUrl    String?
  thumbnailUrl String?
  initialYaw   Float     @default(0)
  initialPitch Float     @default(0)
  initialFov   Float     @default(80)
  floorPlanId  String?
  floorPlanX   Float?
  floorPlanY   Float?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  tour         Tour      @relation(fields: [tourId], references: [id], onDelete: Cascade)
  floorPlan    FloorPlan? @relation(fields: [floorPlanId], references: [id])
  hotspots     Hotspot[]

  @@index([tourId])
  @@index([order])
}

model Hotspot {
  id            String      @id @default(cuid())
  sceneId       String
  type          HotspotType
  yaw           Float
  pitch         Float
  targetSceneId String?
  title         String?
  content       String?
  mediaUrl      String?
  url           String?
  audioUrl      String?
  audioLoop     Boolean     @default(false)
  audioAutoplay Boolean     @default(false)
  icon          String      @default("info")
  color         String      @default("#ffffff")
  scale         Float       @default(1.0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  scene         Scene       @relation(fields: [sceneId], references: [id], onDelete: Cascade)
  targetScene   Scene?      @relation("HotspotTarget", fields: [targetSceneId], references: [id])

  @@index([sceneId])
}

enum HotspotType {
  NAVIGATION
  INFO
  MEDIA
  LINK
  AUDIO
}

model FloorPlan {
  id          String   @id @default(cuid())
  tourId      String
  name        String
  imageUrl    String
  floor       Int      @default(0)
  width       Int?
  height      Int?
  scaleMeters Float?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tour        Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  scenes      Scene[]

  @@index([tourId])
}
```

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │  InviteLink     │
├─────────────────┤       ├─────────────────┤
│ id              │◄──────│ createdById     │
│ email           │       │ token           │
│ name            │       │ expiresAt       │
│ role            │       └─────────────────┘
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│     Session     │       │BrandingSettings │
├─────────────────┤       ├─────────────────┤
│ id              │       │ companyName     │
│ userId          │       │ companyLogo     │
│ token           │       │ primaryColor    │
│ expiresAt       │       │ secondaryColor  │
└─────────────────┘       └─────────────────┘

┌─────────────────┐
│      Tour       │
├─────────────────┤
│ id              │
│ name            │
│ slug (unique)   │
│ password        │
│ ambientMusicUrl │
│ isPublished     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│FloorPlan│ │    Scene    │
├─────────┤ ├─────────────┤
│ id      │ │ id          │
│ tourId  │◄│ tourId      │
│ imageUrl│ │ floorPlanId │◄───┐
│ floor   │ │ panoramaUrl │    │
└─────────┘ │ order       │    │
            └──────┬──────┘    │
                   │           │
                   │ 1:N       │
                   ▼           │
            ┌─────────────┐    │
            │   Hotspot   │    │
            ├─────────────┤    │
            │ id          │    │
            │ sceneId     │    │
            │ type        │    │
            │ yaw, pitch  │    │
            │targetSceneId│────┘
            └─────────────┘
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/invite` | Generate invite link | Required |
| GET | `/api/auth/invite/:token` | Validate invite link | Public |
| POST | `/api/auth/register` | Register with invite | Public |
| POST | `/api/auth/login` | Login with email | Public |
| POST | `/api/auth/logout` | Logout | Required |
| GET | `/api/auth/me` | Get current user | Required |

### Tours

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tours` | List all tours | Required |
| POST | `/api/tours` | Create tour | Required |
| GET | `/api/tours/:id` | Get tour by ID | Required |
| PUT | `/api/tours/:id` | Update tour | Required |
| DELETE | `/api/tours/:id` | Delete tour | Required |
| POST | `/api/tours/:id/publish` | Publish tour | Required |
| POST | `/api/tours/:id/unpublish` | Unpublish tour | Required |
| GET | `/api/tours/slug/:slug` | Get tour by slug | Public* |
| POST | `/api/tours/:id/verify-password` | Verify tour password | Public |

*Returns limited data if password protected

### Scenes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/scenes/:id` | Get scene | Required |
| POST | `/api/scenes` | Create scene | Required |
| PUT | `/api/scenes/:id` | Update scene | Required |
| DELETE | `/api/scenes/:id` | Delete scene | Required |
| PUT | `/api/scenes/:tourId/reorder` | Reorder scenes | Required |
| PUT | `/api/scenes/:id/position` | Update floor plan position | Required |

### Hotspots

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/hotspots/:id` | Get hotspot | Required |
| POST | `/api/hotspots` | Create hotspot | Required |
| PUT | `/api/hotspots/:id` | Update hotspot | Required |
| DELETE | `/api/hotspots/:id` | Delete hotspot | Required |
| POST | `/api/hotspots/batch` | Create multiple | Required |

### Floor Plans

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/floorplans/:id` | Get floor plan | Required |
| POST | `/api/floorplans` | Create floor plan | Required |
| PUT | `/api/floorplans/:id` | Update floor plan | Required |
| DELETE | `/api/floorplans/:id` | Delete floor plan | Required |

### Uploads

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/panorama` | Upload panorama | Required |
| POST | `/api/upload/stereo` | Upload stereo pair | Required |
| POST | `/api/upload/floorplan` | Upload floor plan | Required |
| POST | `/api/upload/audio` | Upload audio file | Required |
| POST | `/api/upload/logo` | Upload company logo | Required |
| DELETE | `/api/upload/:type/:filename` | Delete file | Required |

### Settings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/settings/branding` | Get branding | Public |
| PUT | `/api/settings/branding` | Update branding | Required |

### System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | Public |

---

## Post-MVP Backlog

### Priority: High (Next Release)

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Role-Based Access** | Admin vs Editor permissions | Medium |
| **Tour Analytics** | View counts, time spent, hotspot clicks | Medium |
| **Tour Duplication** | Clone existing tour as template | Low |
| **Bulk Scene Upload** | Upload multiple panoramas at once | Low |

### Priority: Medium (Future)

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Tour Embedding** | iframe embed code for websites | Low |
| **QR Code Generation** | Generate QR codes for tour links | Low |
| **Scene Transitions** | Custom transition effects | Medium |
| **Hotspot Animations** | Animated hotspot indicators | Medium |
| **Tour Expiration** | Auto-unpublish after date | Low |
| **Watermarking** | Add watermark to panoramas | Medium |

### Priority: Low (Backlog)

| Feature | Description | Complexity |
|---------|-------------|------------|
| **VR Optimization** | Enhanced WebXR support | High |
| **Lead Capture** | Contact forms in tours | Medium |
| **Comments** | Client comments on scenes | Medium |
| **Collaboration** | Real-time multi-user editing | High |
| **Version History** | Tour revision history | High |
| **Custom Domains** | White-label domains per client | Medium |

### Future Integration

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Ozone Platform** | SSO and data sync | High |
| **Payment Processing** | Subscription billing | High |
| **Multi-Tenant** | Multiple companies | High |
| **API Access** | Public API for integrations | Medium |

---

## Deployment Guide

### Prerequisites

- Ubuntu 20.04+ VPS
- Docker and Docker Compose installed
- Domain pointing to VPS IP
- SSH access

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/ozone-virtual-tours.git
cd ozone-virtual-tours

# 2. Copy environment template
cp .env.example .env.production

# 3. Edit environment variables
nano .env.production

# 4. Build and start containers
docker-compose -f docker-compose.yml up -d --build

# 5. Run database migrations
docker-compose exec api npx prisma migrate deploy

# 6. Seed initial data
docker-compose exec api npx prisma db seed

# 7. Set up SSL (first time only)
docker-compose exec nginx certbot --nginx -d yourdomain.com
```

### Environment Variables

```bash
# .env.production

# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/ozone_tours

# Server
NODE_ENV=production
PORT=3001
BASE_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Session
SESSION_SECRET=your-secure-random-string-here

# File Storage
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=52428800

# Optional: External Storage (future)
# R2_ACCOUNT_ID=
# R2_ACCESS_KEY=
# R2_SECRET_KEY=
# R2_BUCKET=
```

### Backup Strategy

```bash
# Daily database backup (add to crontab)
0 2 * * * docker-compose exec -T postgres pg_dump -U postgres ozone_tours | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Weekly uploads backup
0 3 * * 0 tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /var/lib/docker/volumes/ozone_uploads/_data
```

### Monitoring

```bash
# View logs
docker-compose logs -f

# Check container status
docker-compose ps

# Check disk usage
df -h
du -sh /var/lib/docker/volumes/ozone_uploads/_data

# Health check
curl https://yourdomain.com/api/health
```

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| File storage fills up | Medium | High | Monitor disk usage, implement cleanup, consider external storage |
| Database corruption | Low | Critical | Daily backups, test restore procedure |
| Security breach | Low | Critical | Security headers, rate limiting, input validation |
| Performance under load | Medium | Medium | CDN for static files, database indexing, caching |

### Project Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | High | Medium | Strict MVP definition, backlog for future features |
| Browser compatibility | Medium | Medium | Test on major browsers, progressive enhancement |
| Mobile performance | Medium | High | Optimize images, lazy loading, test on real devices |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| VPS downtime | Low | High | Monitor uptime, have restore procedure ready |
| SSL certificate expiry | Low | Medium | Auto-renewal with Certbot |
| Lost admin access | Low | Critical | Document recovery procedure, backup admin credentials |

---

## Glossary

| Term | Definition |
|------|------------|
| **Panorama** | 360° equirectangular image used for scene viewing |
| **Scene** | A single viewpoint in a tour, displayed as a 360° panorama |
| **Hotspot** | Interactive point in a scene that triggers an action |
| **Slug** | URL-friendly identifier for a tour (e.g., "luxury-apartment") |
| **Floor Plan** | Architectural diagram showing scene positions |
| **Ambient Music** | Background audio that plays throughout the tour |
| **Yaw** | Horizontal rotation angle in spherical coordinates |
| **Pitch** | Vertical rotation angle in spherical coordinates |
| **WebXR** | Web standard for virtual and augmented reality |
| **A-Frame** | Web framework for building VR experiences |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | Development Team | Initial roadmap |

---

*This document serves as the single source of truth for the Ozone Virtual Tours MVP development. All team members should reference this document for requirements, technical decisions, and implementation guidelines.*

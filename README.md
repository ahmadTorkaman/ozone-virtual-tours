# Ozone Virtual Tours Module

A VR-ready virtual tour system for interior design presentations, built as part of the Ozone platform.

## Features

### Virtual Tours
- 🎯 **360° Panorama Viewer** - Equirectangular image support with smooth navigation
- 🥽 **VR Support** - WebXR-ready with stereo side-by-side rendering
- 🔗 **Interactive Hotspots** - Navigation links, info points, and media embeds
- 🗺️ **Floor Plan Navigation** - Visual mini-map with scene indicators
- 🎬 **Guided Tours** - Auto-play mode with timed transitions
- 📱 **Responsive** - Works on desktop, mobile, and VR headsets
- 🎨 **Ozone Design System** - Consistent with main platform aesthetics

### Material Editor (NEW)
- 🎨 **PBR Material Library** - Create and manage physically-based rendering materials
- 🔮 **Live 3D Preview** - Real-time material preview with multiple shapes and environments
- 📦 **Material Presets** - 14 built-in presets (Chrome, Gold, Rubber, Glass, etc.)
- 🖼️ **Texture Support** - Upload normal, roughness, metalness, AO, height, and emissive maps
- 📁 **Category Management** - Organize materials into custom categories
- ☁️ **Cloud Sync** - Sync material libraries across devices
- 📥 **Import/Export** - Share material libraries as JSON files

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| 3D/VR | A-Frame + Three.js |
| Material Editor | React Three Fiber + Drei |
| State | Zustand |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma |
| Storage | Cloudflare R2 |

## Getting Started

See [QUICKSTART.md](./QUICKSTART.md) for setup instructions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RENDER.COM                               │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Web Service   │   PostgreSQL    │   Static Site           │
│   (Node.js API) │   (Database)    │   (React Frontend)      │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Cloudflare R2         │
              │   (Panorama Storage)    │
              └─────────────────────────┘
```

## Admin Panel Routes

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard with stats and quick actions |
| `/admin/tours` | Tour management (list, create, edit) |
| `/admin/tours/:id` | Tour editor with scenes, hotspots, floor plans |
| `/admin/materials` | **Material Library** - Create and manage PBR materials |
| `/admin/branding` | Company branding settings |
| `/admin/team` | Team member management |

## API Endpoints

### Tours
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tours` | List all tours |
| GET | `/api/tours/:id` | Get tour with scenes |
| GET | `/api/tours/slug/:slug` | Get tour by public slug |
| POST | `/api/tours` | Create new tour |
| PUT | `/api/tours/:id` | Update tour |
| DELETE | `/api/tours/:id` | Delete tour |
| POST | `/api/tours/:id/publish` | Publish tour |
| POST | `/api/tours/:id/unpublish` | Unpublish tour |

### Scenes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tours/:tourId/scenes` | List scenes for tour |
| POST | `/api/tours/:tourId/scenes` | Add scene to tour |
| PUT | `/api/tours/:tourId/scenes/:id` | Update scene |
| DELETE | `/api/tours/:tourId/scenes/:id` | Remove scene |
| POST | `/api/tours/:tourId/scenes/reorder` | Reorder scenes |

### Hotspots
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tours/:tourId/scenes/:sceneId/hotspots` | List hotspots |
| POST | `/api/tours/:tourId/scenes/:sceneId/hotspots` | Create hotspot |
| PUT | `/api/tours/:tourId/scenes/:sceneId/hotspots/:id` | Update hotspot |
| DELETE | `/api/tours/:tourId/scenes/:sceneId/hotspots/:id` | Remove hotspot |

### Floor Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tours/:tourId/floorplans` | List floor plans |
| POST | `/api/tours/:tourId/floorplans` | Create floor plan |
| PUT | `/api/tours/:tourId/floorplans/:id` | Update floor plan |
| DELETE | `/api/tours/:tourId/floorplans/:id` | Delete floor plan |

### Material Library
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/library` | Fetch user's material library |
| POST | `/api/library/sync` | Sync entire library to cloud |
| GET | `/api/library/material/:id` | Get single material |
| PUT | `/api/library/material/:id` | Create/update material |
| DELETE | `/api/library/material/:id` | Delete material |
| POST | `/api/library/categories` | Update categories |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/panorama` | Upload panorama image |
| POST | `/api/upload/stereo` | Upload stereo panorama |
| POST | `/api/upload/floorplan` | Upload floor plan image |
| POST | `/api/upload/audio` | Upload audio file |
| POST | `/api/upload/logo` | Upload company logo |
| POST | `/api/upload/texture` | Upload material texture |
| DELETE | `/api/upload/:type/:filename` | Delete uploaded file |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/branding` | Get branding settings |
| PUT | `/api/settings/branding` | Update branding |
| GET | `/api/settings/team` | Get team members |
| GET | `/api/settings/team/stats` | Get team statistics |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/login` | Login with email |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/bootstrap` | Check if setup needed |
| POST | `/api/auth/register` | Register with invite |
| POST | `/api/auth/invite` | Create invite link |
| GET | `/api/auth/invites` | List pending invites |

## Documentation

- [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup guide
- [CHANGELOG.md](./CHANGELOG.md) - Release notes
- [docs/MVP_ROADMAP.md](./docs/MVP_ROADMAP.md) - Development roadmap
- [docs/MATERIAL_EDITOR.md](./docs/MATERIAL_EDITOR.md) - Material Editor documentation
- [docs/API.md](./docs/API.md) - Detailed API reference

## License

Proprietary - Ozone Platform

# Ozone Virtual Tours Module

A VR-ready virtual tour system for interior design presentations, built as part of the Ozone platform.

## Features

- 🎯 **360° Panorama Viewer** - Equirectangular image support with smooth navigation
- 🥽 **VR Support** - WebXR-ready with stereo side-by-side rendering
- 🔗 **Interactive Hotspots** - Navigation links, info points, and media embeds
- 🗺️ **Floor Plan Navigation** - Visual mini-map with scene indicators
- 🎬 **Guided Tours** - Auto-play mode with timed transitions
- 📱 **Responsive** - Works on desktop, mobile, and VR headsets
- 🎨 **Ozone Design System** - Consistent with main platform aesthetics

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| 3D/VR | A-Frame + Three.js |
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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tours` | List all tours |
| GET | `/api/tours/:id` | Get tour with scenes |
| POST | `/api/tours` | Create new tour |
| PUT | `/api/tours/:id` | Update tour |
| DELETE | `/api/tours/:id` | Delete tour |
| POST | `/api/scenes` | Add scene to tour |
| PUT | `/api/scenes/:id` | Update scene |
| DELETE | `/api/scenes/:id` | Remove scene |
| POST | `/api/hotspots` | Create hotspot |
| PUT | `/api/hotspots/:id` | Update hotspot |
| DELETE | `/api/hotspots/:id` | Remove hotspot |
| POST | `/api/upload/panorama` | Upload panorama image |

## License

Proprietary - Ozone Platform

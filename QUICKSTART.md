# Ozone Virtual Tours - Quickstart Guide

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- VS Code with terminal

### 1. Install Dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Configure Environment

```bash
# In /server directory, copy the example env file
cp .env.example .env

# Edit .env with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/ozone_tours"
```

### 3. Setup Database

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Add Demo Panorama

Place a 360° equirectangular image in:
```
client/public/demo/kitchen-overview.jpg
```

> 💡 **Tip**: You can use any equirectangular panorama. Search "equirectangular panorama free" for test images.

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 6. Open in Browser

Visit: `http://localhost:5173`

---

## 📁 Project Structure

```
ozone-virtual-tours/
├── client/                     # React frontend
│   ├── public/
│   │   └── demo/              # Demo panorama images
│   ├── src/
│   │   ├── components/
│   │   │   ├── viewer/        # Tour viewer (A-Frame)
│   │   │   └── admin/
│   │   │       ├── tour-editor/    # Tour editing components
│   │   │       └── material-editor/ # Material Editor (R3F)
│   │   ├── contexts/          # React contexts (Auth, Branding)
│   │   ├── pages/admin/       # Admin pages (Dashboard, Tours, Materials)
│   │   ├── stores/            # Zustand state (tourStore, materialStore)
│   │   ├── services/          # API service layer
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── routes/            # API routes (tours, library, upload, etc.)
│   │   ├── middleware/        # Auth, rate limiting, file validation
│   │   ├── utils/             # Logger and helpers
│   │   └── index.js           # Entry point
│   ├── .env.example
│   └── package.json
│
├── docs/                       # Documentation
│   ├── MVP_ROADMAP.md         # Development roadmap
│   ├── MATERIAL_EDITOR.md     # Material Editor guide
│   └── API.md                 # API reference
│
├── shared/                     # Shared types/constants
│   └── types.js
│
├── QUICKSTART.md              # This file
├── CHANGELOG.md               # Release notes
└── README.md                  # Full documentation
```

---

## 🎮 Controls

### Desktop
- **Click + Drag**: Look around
- **Scroll**: Zoom (if enabled)
- **Click Hotspot**: Navigate or show info

### VR Mode
- **Gaze**: Point at hotspots
- **Wait 1.5s**: Activate hotspot
- **Controller Trigger**: Click (if controllers available)

---

## 🛠 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npx prisma studio` | Open database GUI |
| `npx prisma migrate dev` | Run migrations |

---

## 📦 Adding Your Own Panoramas

### From 3D Software (V-Ray, Corona, etc.)

1. Set camera to **Spherical/360°** type
2. Render at **2:1 aspect ratio** (e.g., 4096×2048)
3. Export as **JPG or PNG**
4. For stereo VR: Render **side-by-side** stereo pair

### Supported Formats
- **Mono**: Single equirectangular image
- **Stereo**: Side-by-side (left|right) for VR headsets

---

## 🔧 Configuration

### Tour Settings (`tourStore.js`)

```javascript
{
  autoRotate: false,        // Auto-rotate when idle
  autoRotateSpeed: 0.5,     // Rotation speed
  defaultFov: 80,           // Field of view
  transitionDuration: 1000, // Scene transition (ms)
  vrEnabled: true,          // Show VR button
  showFloorPlan: true,      // Show mini-map
  guidedTourDelay: 5000     // Auto-advance delay (ms)
}
```

---

## 🚢 Deployment (Render.com)

### 1. Create Services

- **Web Service**: Node.js backend (`/server`)
- **Static Site**: React frontend (`/client`)
- **PostgreSQL**: Managed database

### 2. Environment Variables

**Backend:**
```
DATABASE_URL=postgresql://...
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.onrender.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=ozone-tours
```

### 3. Build Commands

**Backend:**
```bash
npm install && npx prisma migrate deploy
```

**Frontend:**
```bash
npm install && npm run build
```

---

## 🎨 Material Editor

The Material Editor allows you to create and manage PBR (Physically Based Rendering) materials for your 3D scenes.

### Accessing the Material Editor

1. Login to the admin panel at `/admin`
2. Click **Materials** in the sidebar
3. Click **New Material** to create a new material

### Material Properties

| Property | Range | Description |
|----------|-------|-------------|
| Base Color | Hex | The main color of the material |
| Metalness | 0-1 | How metallic the surface appears |
| Roughness | 0-1 | Surface smoothness (0=mirror, 1=matte) |
| Opacity | 0-1 | Transparency level |
| Emissive | Hex | Self-illumination color |
| Emissive Intensity | 0-2 | Brightness of emission |

### Texture Maps

Upload texture maps for advanced materials:
- **Albedo**: Base color texture
- **Normal**: Surface detail bumps
- **Roughness**: Per-pixel roughness variation
- **Metalness**: Per-pixel metallic variation
- **AO**: Ambient occlusion shadows
- **Height**: Displacement mapping
- **Emissive**: Glowing areas

### 3D Preview

- **Shapes**: Sphere, Cube, Torus, TorusKnot, Plane
- **Environments**: Studio, Sunset, Warehouse, Forest, Night, City
- **Controls**: Click and drag to rotate the preview

### Import/Export

- Export your material library as JSON for backup
- Import materials from other projects
- Share material libraries with team members

---

## 📚 Next Steps

1. **Create materials** in the Material Editor for your 3D scenes
2. **Add real panoramas** from your interior design projects
3. **Connect to Ozone projects** via `projectRef` field
4. **Add analytics** to track tour engagement
5. **Implement sharing** with public/private links

---

## 🆘 Troubleshooting

### "Panorama not loading"
- Check file path is correct
- Ensure image is equirectangular format
- Check browser console for errors

### "VR button not showing"
- WebXR requires HTTPS (except localhost)
- Check browser supports WebXR

### "Database connection failed"
- Verify DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run `npx prisma migrate dev`

---

## 📞 Support

- **Ozone Docs**: Internal wiki
- **A-Frame Docs**: https://aframe.io/docs
- **Prisma Docs**: https://prisma.io/docs

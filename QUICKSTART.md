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
│   │   │   ├── viewer/        # Tour viewer components
│   │   │   ├── admin/         # Admin panel components
│   │   │   └── shared/        # Reusable UI
│   │   ├── hooks/             # Custom React hooks
│   │   ├── stores/            # Zustand state stores
│   │   ├── utils/             # Helper functions
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── routes/            # API routes
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, upload, etc.
│   │   ├── services/          # Business logic
│   │   └── index.js           # Entry point
│   ├── .env.example
│   └── package.json
│
├── shared/                     # Shared types/constants
│   └── types.js
│
├── QUICKSTART.md              # This file
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

## 📚 Next Steps

1. **Add real panoramas** from your interior design projects
2. **Build admin panel** for non-technical users
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

# Ozone Studio

A professional 3D scene viewer and 360° panorama application for interior designers. Built with Tauri for native desktop performance.

## Features

- **3D Scene Viewer** - Load and navigate GLB/glTF models with first-person controls
- **Material System** - Full PBR material editor with texture support
- **360° Panoramas** - Equirectangular image viewer with hotspot navigation
- **VR Support** - WebXR integration for immersive presentations
- **License System** - Trial, Professional, and Enterprise tiers
- **Auto Updates** - Built-in update system via Tauri

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Tauri 2.0 (Rust) |
| Frontend | React 18 + TypeScript |
| 3D Rendering | Three.js + React Three Fiber |
| State Management | Zustand |
| Database | SQLite (local) |
| Build Tool | Vite |

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 8+ (`npm install -g pnpm`)
- **Rust** 1.75+ ([rustup.rs](https://rustup.rs))
- **Visual Studio Build Tools** 2022 (Windows)

### Development

```bash
# Clone the repository
git clone https://github.com/your-org/ozone-virtual-tours.git
cd ozone-virtual-tours

# Install dependencies
pnpm install
cd client && pnpm install
cd ..

# Start development
cargo tauri dev
```

### Building

```bash
# Production build (creates installers)
cargo tauri build

# Outputs:
# - src-tauri/target/release/bundle/msi/   (MSI installer)
# - src-tauri/target/release/bundle/nsis/  (NSIS installer)
```

## Project Structure

```
ozone-virtual-tours/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/          # Route components
│   │   ├── features/       # Feature modules
│   │   ├── stores/         # Zustand state
│   │   ├── services/       # Tauri API wrappers
│   │   └── engine/         # 3D rendering
│   └── package.json
│
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri commands
│   │   ├── db/             # SQLite layer
│   │   └── models/         # Data structures
│   ├── Cargo.toml
│   └── tauri.conf.json
│
└── docs/                   # Documentation
    ├── DEVELOPER_GUIDE.md  # Development guide
    ├── API.md              # Command reference
    ├── ARCHITECTURE.md     # System design
    └── CONTRIBUTING.md     # Contribution guide
```

## Documentation

| Document | Description |
|----------|-------------|
| [Developer Guide](./docs/DEVELOPER_GUIDE.md) | Complete development setup and workflows |
| [API Reference](./docs/API.md) | All Tauri commands documentation |
| [Architecture](./docs/ARCHITECTURE.md) | System design and decisions |
| [Contributing](./docs/CONTRIBUTING.md) | How to contribute |

## Development Commands

```bash
# Start development server
cargo tauri dev

# Run tests
cd client && pnpm test

# Type checking
cd client && pnpm typecheck

# Linting
cd client && pnpm lint

# Format Rust code
cd src-tauri && cargo fmt
```

## Data Storage

All data is stored locally in the user's Documents folder:

```
Documents/Ozone Studio/
├── database.sqlite     # SQLite database
├── projects/           # Project files
│   └── {project-id}/
│       ├── scenes/     # GLB files
│       └── panoramas/  # 360° images
└── materials/          # Material library
    └── textures/       # Texture files
```

## License Tiers

| Feature | Trial | Professional | Enterprise |
|---------|-------|--------------|------------|
| Projects | 3 | 50 | Unlimited |
| Scenes/Project | 5 | 100 | Unlimited |
| Export | No | Yes | Yes |
| VR Mode | No | Yes | Yes |
| Cloud Sync | No | No | Yes |

## License

Proprietary - Ozone Platform

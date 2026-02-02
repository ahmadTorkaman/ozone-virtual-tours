# Phase 7: Panorama Viewer

> **Scope**: 360° panorama viewing with hotspot navigation
> **Prerequisites**: Phase 6 complete (cloud sync & license)
> **Outputs**: Full panorama viewing experience with hotspots

---

## Overview

This phase implements the panorama viewing system for the Tauri desktop app:

1. 360° equirectangular panorama rendering
2. Hotspot system (navigation, info, media)
3. Smooth transitions between panoramas
4. Panorama editor for hotspot placement
5. Local file storage via Tauri

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer (Tauri desktop app)
- **Current State**: Phase 6 complete (license & cloud sync)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Building panorama viewer and hotspot system
- **Storage**: Local files via Tauri file system API

Read `/docs/ARCHITECTURE.md` for full context.

---

## Task Checklist

### 7.1 Panorama Types

Create `client/src/types/panorama.ts`:

```typescript
export interface Panorama {
  id: string;
  name: string;
  description?: string;

  imagePath: string; // Relative path to equirectangular image
  thumbnailPath?: string;

  initialYaw: number; // Starting rotation (degrees)
  initialPitch: number;

  projectId: string;
  order: number;

  createdAt: string;
  updatedAt: string;
}

export type HotspotType = 'navigation' | 'info' | 'media' | 'link';

export interface Hotspot {
  id: string;
  type: HotspotType;

  yaw: number; // Horizontal position (degrees, -180 to 180)
  pitch: number; // Vertical position (degrees, -90 to 90)

  // For navigation hotspots
  targetPanoramaId?: string;

  // For info/media hotspots
  content?: HotspotContent;

  // Visual customization
  icon?: string;
  color?: string;
  scale?: number;

  panoramaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotspotContent {
  title?: string;
  description?: string;
  url?: string;
  mediaPath?: string;
  mediaType?: 'image' | 'video';
}

export interface CreatePanorama {
  name: string;
  description?: string;
  imagePath: string;
  thumbnailPath?: string;
  initialYaw?: number;
  initialPitch?: number;
  projectId: string;
}

export interface CreateHotspot {
  type: HotspotType;
  yaw: number;
  pitch: number;
  targetPanoramaId?: string;
  content?: HotspotContent;
  icon?: string;
  color?: string;
  scale?: number;
  panoramaId: string;
}
```

### 7.2 Rust Panorama Commands

Add to `src-tauri/src/commands/panoramas.rs`:

```rust
use crate::db::Database;
use crate::models::{Panorama, Hotspot, CreatePanorama, CreateHotspot};
use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub fn list_panoramas(project_id: &str, db: State<Mutex<Database>>) -> Result<Vec<Panorama>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.list_panoramas(project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_panorama(id: &str, db: State<Mutex<Database>>) -> Result<Panorama, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_panorama(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_panorama(data: CreatePanorama, db: State<Mutex<Database>>) -> Result<Panorama, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.create_panorama(data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_panorama(id: &str, data: serde_json::Value, db: State<Mutex<Database>>) -> Result<Panorama, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_panorama(id, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_panorama(id: &str, db: State<Mutex<Database>>) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_panorama(id).map_err(|e| e.to_string())
}

// Hotspots
#[tauri::command]
pub fn list_hotspots(panorama_id: &str, db: State<Mutex<Database>>) -> Result<Vec<Hotspot>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.list_hotspots(panorama_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_hotspot(data: CreateHotspot, db: State<Mutex<Database>>) -> Result<Hotspot, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.create_hotspot(data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_hotspot(id: &str, data: serde_json::Value, db: State<Mutex<Database>>) -> Result<Hotspot, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_hotspot(id, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_hotspot(id: &str, db: State<Mutex<Database>>) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_hotspot(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_panorama_image(
    source_path: &str,
    project_id: &str,
    db: State<'_, Mutex<Database>>,
) -> Result<String, String> {
    use std::path::Path;
    use std::fs;

    let data_path = {
        let db = db.lock().map_err(|e| e.to_string())?;
        db.get_settings().map_err(|e| e.to_string())?.data_path
    };

    let pano_dir = Path::new(&data_path)
        .join("projects")
        .join(project_id)
        .join("panoramas");
    fs::create_dir_all(&pano_dir).map_err(|e| e.to_string())?;

    let source = Path::new(source_path);
    let filename = source.file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid filename")?;

    let id = uuid::Uuid::new_v4().to_string();
    let extension = source.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");
    let dest_filename = format!("{}_{}.{}", id, filename, extension);
    let dest_path = pano_dir.join(&dest_filename);

    fs::copy(source_path, &dest_path).map_err(|e| e.to_string())?;

    let relative_path = format!("projects/{}/panoramas/{}", project_id, dest_filename);
    Ok(relative_path)
}
```

### 7.3 Panorama Service

Create `client/src/services/panoramaService.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { Panorama, Hotspot, CreatePanorama, CreateHotspot } from '@/types/panorama';

export const panoramaService = {
  async list(projectId: string): Promise<Panorama[]> {
    return invoke<Panorama[]>('list_panoramas', { projectId });
  },

  async get(id: string): Promise<Panorama> {
    return invoke<Panorama>('get_panorama', { id });
  },

  async create(data: CreatePanorama): Promise<Panorama> {
    return invoke<Panorama>('create_panorama', { data });
  },

  async update(id: string, data: Partial<Panorama>): Promise<Panorama> {
    return invoke<Panorama>('update_panorama', { id, data });
  },

  async delete(id: string): Promise<void> {
    return invoke('delete_panorama', { id });
  },

  async importImage(projectId: string): Promise<string | null> {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    });

    if (!selected) return null;

    return invoke<string>('import_panorama_image', {
      sourcePath: selected,
      projectId,
    });
  },

  async listHotspots(panoramaId: string): Promise<Hotspot[]> {
    return invoke<Hotspot[]>('list_hotspots', { panoramaId });
  },

  async createHotspot(data: CreateHotspot): Promise<Hotspot> {
    return invoke<Hotspot>('create_hotspot', { data });
  },

  async updateHotspot(id: string, data: Partial<Hotspot>): Promise<Hotspot> {
    return invoke<Hotspot>('update_hotspot', { id, data });
  },

  async deleteHotspot(id: string): Promise<void> {
    return invoke('delete_hotspot', { id });
  },
};
```

### 7.4 Panorama Store

Create `client/src/stores/panoramaStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Panorama, Hotspot } from '@/types/panorama';

interface PanoramaState {
  currentPanoramaId: string | null;
  panoramas: Panorama[];
  hotspots: Hotspot[];
  yaw: number;
  pitch: number;
  fov: number;
  isLoading: boolean;
  isTransitioning: boolean;
  isEditing: boolean;
  selectedHotspotId: string | null;

  setPanoramas: (panoramas: Panorama[]) => void;
  setHotspots: (hotspots: Hotspot[]) => void;
  setCurrentPanorama: (id: string | null) => void;
  setCamera: (yaw: number, pitch: number, fov?: number) => void;
  setLoading: (loading: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  setEditing: (editing: boolean) => void;
  setSelectedHotspot: (id: string | null) => void;
  addHotspot: (hotspot: Hotspot) => void;
  updateHotspot: (id: string, updates: Partial<Hotspot>) => void;
  removeHotspot: (id: string) => void;
  reset: () => void;
}

export const usePanoramaStore = create<PanoramaState>()(
  devtools(
    (set) => ({
      currentPanoramaId: null,
      panoramas: [],
      hotspots: [],
      yaw: 0,
      pitch: 0,
      fov: 75,
      isLoading: false,
      isTransitioning: false,
      isEditing: false,
      selectedHotspotId: null,

      setPanoramas: (panoramas) => set({ panoramas }),
      setHotspots: (hotspots) => set({ hotspots }),
      setCurrentPanorama: (id) => set({ currentPanoramaId: id }),
      setCamera: (yaw, pitch, fov) =>
        set((state) => ({ yaw, pitch, fov: fov ?? state.fov })),
      setLoading: (loading) => set({ isLoading: loading }),
      setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
      setEditing: (editing) => set({ isEditing: editing }),
      setSelectedHotspot: (id) => set({ selectedHotspotId: id }),

      addHotspot: (hotspot) =>
        set((state) => ({ hotspots: [...state.hotspots, hotspot] })),

      updateHotspot: (id, updates) =>
        set((state) => ({
          hotspots: state.hotspots.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),

      removeHotspot: (id) =>
        set((state) => ({
          hotspots: state.hotspots.filter((h) => h.id !== id),
          selectedHotspotId:
            state.selectedHotspotId === id ? null : state.selectedHotspotId,
        })),

      reset: () =>
        set({
          currentPanoramaId: null,
          panoramas: [],
          hotspots: [],
          yaw: 0,
          pitch: 0,
          fov: 75,
          isLoading: false,
          isTransitioning: false,
          isEditing: false,
          selectedHotspotId: null,
        }),
    }),
    { name: 'panorama-store' }
  )
);
```

### 7.5 Panorama Viewer Component

Create `client/src/features/panorama/PanoramaViewer.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePanoramaStore } from '@/stores/panoramaStore';
import { getAssetUrl } from '@/lib/tauri-file';
import { useSettingsStore } from '@/stores/settingsStore';
import { HotspotMarker } from './HotspotMarker';

interface PanoramaViewerProps {
  imagePath: string;
  onHotspotClick?: (hotspotId: string) => void;
}

export function PanoramaViewer({ imagePath, onHotspotClick }: PanoramaViewerProps) {
  const dataPath = useSettingsStore((s) => s.settings?.dataPath);
  const { hotspots, isTransitioning, setLoading } = usePanoramaStore();

  const imageUrl = dataPath ? getAssetUrl(`${dataPath}/${imagePath}`) : null;

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 0.1] }}>
        <PanoramaSphere imageUrl={imageUrl} onLoad={() => setLoading(false)} />
        <PanoramaControls />

        {hotspots.map((hotspot) => (
          <HotspotMarker
            key={hotspot.id}
            hotspot={hotspot}
            onClick={() => onHotspotClick?.(hotspot.id)}
          />
        ))}
      </Canvas>

      {isTransitioning && (
        <div className="absolute inset-0 bg-black/50 transition-opacity" />
      )}
    </div>
  );
}

function PanoramaSphere({ imageUrl, onLoad }: { imageUrl: string; onLoad?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { setLoading } = usePanoramaStore();

  useEffect(() => {
    setLoading(true);
    const loader = new THREE.TextureLoader();

    loader.load(
      imageUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        if (meshRef.current) {
          const material = meshRef.current.material as THREE.MeshBasicMaterial;
          material.map = texture;
          material.needsUpdate = true;
        }

        onLoad?.();
      },
      undefined,
      (error) => {
        console.error('Failed to load panorama:', error);
        setLoading(false);
      }
    );
  }, [imageUrl, onLoad, setLoading]);

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial side={THREE.BackSide} />
    </mesh>
  );
}

function PanoramaControls() {
  const { camera, gl } = useThree();
  const { yaw, pitch, setCamera } = usePanoramaStore();

  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ yaw: 0, pitch: 0 });

  useEffect(() => {
    targetRotation.current = { yaw, pitch };
  }, [yaw, pitch]);

  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
      domElement.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - prevMouse.current.x;
      const deltaY = e.clientY - prevMouse.current.y;

      targetRotation.current.yaw -= deltaX * 0.2;
      targetRotation.current.pitch = Math.max(
        -85,
        Math.min(85, targetRotation.current.pitch + deltaY * 0.2)
      );

      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDragging.current = false;
      domElement.releasePointerCapture(e.pointerId);
      setCamera(targetRotation.current.yaw, targetRotation.current.pitch);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newFov = Math.max(30, Math.min(100, (camera as THREE.PerspectiveCamera).fov + e.deltaY * 0.05));
      (camera as THREE.PerspectiveCamera).fov = newFov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
    };
  }, [gl.domElement, camera, setCamera]);

  useFrame(() => {
    const { yaw, pitch } = targetRotation.current;

    const phi = THREE.MathUtils.degToRad(90 - pitch);
    const theta = THREE.MathUtils.degToRad(yaw);

    const target = new THREE.Vector3(
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.cos(theta)
    );

    camera.lookAt(target);
  });

  return null;
}
```

### 7.6 Hotspot Marker

Create `client/src/features/panorama/HotspotMarker.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Hotspot } from '@/types/panorama';
import { usePanoramaStore } from '@/stores/panoramaStore';

interface HotspotMarkerProps {
  hotspot: Hotspot;
  onClick?: () => void;
}

export function HotspotMarker({ hotspot, onClick }: HotspotMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { selectedHotspotId, isEditing } = usePanoramaStore();
  const isSelected = selectedHotspotId === hotspot.id;

  const phi = THREE.MathUtils.degToRad(90 - hotspot.pitch);
  const theta = THREE.MathUtils.degToRad(hotspot.yaw);

  const distance = 50;
  const position = new THREE.Vector3(
    distance * Math.sin(phi) * Math.sin(theta),
    distance * Math.cos(phi),
    distance * Math.sin(phi) * Math.cos(theta)
  );

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  const getColor = () => {
    if (isSelected) return '#00ff00';
    switch (hotspot.type) {
      case 'navigation': return hotspot.color || '#ffffff';
      case 'info': return hotspot.color || '#3b82f6';
      case 'media': return hotspot.color || '#8b5cf6';
      case 'link': return hotspot.color || '#f59e0b';
      default: return '#ffffff';
    }
  };

  const scale = hotspot.scale ?? 1;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <mesh>
        <ringGeometry args={[1.5 * scale, 2 * scale, 32]} />
        <meshBasicMaterial
          color={getColor()}
          transparent
          opacity={isSelected ? 1 : 0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[1.2 * scale, 32]} />
        <meshBasicMaterial
          color={getColor()}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isEditing && isSelected && (
        <mesh position={[0, 0, -0.01]}>
          <ringGeometry args={[2.5 * scale, 3 * scale, 32]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
```

### 7.7 Export Feature

Create `client/src/features/panorama/index.ts`:

```typescript
export { PanoramaViewer } from './PanoramaViewer';
export { HotspotMarker } from './HotspotMarker';
```

---

## Verification Checklist

After completing Phase 7, verify:

- [ ] Panorama images load from local filesystem
- [ ] Click and drag to rotate view
- [ ] Scroll to zoom in/out
- [ ] Navigation hotspots appear and are clickable
- [ ] Clicking navigation hotspot changes panorama
- [ ] Info hotspots show popup with content
- [ ] Media hotspots display images/videos
- [ ] Smooth transitions between panoramas
- [ ] Hotspot editor works (create, move, delete)

---

## Next Phase

After Phase 7 is complete, proceed to **Phase 8: Distribution** which covers:
- Windows installer creation
- Auto-update system
- Code signing
- Release workflow

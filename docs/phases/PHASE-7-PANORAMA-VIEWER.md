# Phase 7: Panorama Viewer

> **Estimated Scope**: Rewrite panorama viewer as secondary feature
> **Prerequisites**: Phase 6 complete (PWA working)
> **Outputs**: Clean, functional 360° panorama viewer

---

## Overview

This phase fixes and rewrites the panorama viewer:

1. Rewrite using React Three Fiber (consistent with scene viewer)
2. Hotspot system (navigation, info, media, link)
3. Stereo VR support for panoramas
4. Integration with project system
5. Smooth transitions between panoramas

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer for interior designers
- **Current State**: Phase 6 complete (full app with offline support)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Fixing the panorama viewer (secondary feature)

The panorama viewer is a **secondary feature** alongside the main 3D GLB viewer. It's kept for:
- Backward compatibility with existing tours
- Quick previews without full 3D scenes
- Simpler content creation workflow

Read `/docs/ARCHITECTURE.md` for full context.

---

## Task Checklist

### 7.1 Create Panorama Store

Create `client/src/stores/panoramaStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Panorama, Hotspot } from '@/types/panorama';

interface PanoramaState {
  // Current panorama
  currentPanorama: Panorama | null;
  panoramas: Panorama[];
  isLoading: boolean;
  error: string | null;

  // View state
  yaw: number;
  pitch: number;
  fov: number;

  // Interaction
  hoveredHotspotId: string | null;
  activeHotspotId: string | null;

  // Transition
  isTransitioning: boolean;

  // Actions
  setPanorama: (panorama: Panorama | null) => void;
  setPanoramas: (panoramas: Panorama[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setView: (yaw: number, pitch: number) => void;
  setFov: (fov: number) => void;
  setHoveredHotspot: (id: string | null) => void;
  setActiveHotspot: (id: string | null) => void;
  navigateTo: (panoramaId: string) => void;
  reset: () => void;
}

const initialState = {
  currentPanorama: null,
  panoramas: [],
  isLoading: false,
  error: null,
  yaw: 0,
  pitch: 0,
  fov: 75,
  hoveredHotspotId: null,
  activeHotspotId: null,
  isTransitioning: false,
};

export const usePanoramaStore = create<PanoramaState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setPanorama: (panorama) =>
        set({
          currentPanorama: panorama,
          yaw: panorama?.initialYaw ?? 0,
          pitch: panorama?.initialPitch ?? 0,
          error: null,
        }),

      setPanoramas: (panoramas) => set({ panoramas }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      setView: (yaw, pitch) => set({ yaw, pitch }),

      setFov: (fov) => set({ fov: Math.max(30, Math.min(100, fov)) }),

      setHoveredHotspot: (id) => set({ hoveredHotspotId: id }),

      setActiveHotspot: (id) => set({ activeHotspotId: id }),

      navigateTo: (panoramaId) => {
        const { panoramas } = get();
        const target = panoramas.find((p) => p.id === panoramaId);

        if (target) {
          set({ isTransitioning: true });

          // Fade out, change panorama, fade in
          setTimeout(() => {
            set({
              currentPanorama: target,
              yaw: target.initialYaw,
              pitch: target.initialPitch,
              isTransitioning: false,
            });
          }, 300);
        }
      },

      reset: () => set(initialState),
    }),
    { name: 'panorama-store' }
  )
);
```

### 7.2 Create Panorama Types

Create `client/src/types/panorama.ts`:

```typescript
export type HotspotType = 'NAVIGATION' | 'INFO' | 'MEDIA' | 'LINK';

export interface Hotspot {
  id: string;
  type: HotspotType;
  yaw: number;
  pitch: number;
  targetId?: string; // For NAVIGATION type
  content?: {
    title?: string;
    description?: string;
    url?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
  };
  icon?: string;
  color?: string;
}

export interface Panorama {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  stereoUrl?: string;
  thumbnailUrl?: string;
  initialYaw: number;
  initialPitch: number;
  projectId: string;
  hotspots: Hotspot[];
  order: number;
}
```

### 7.3 Create Panorama Viewer Component

Create `client/src/features/panorama/PanoramaViewer.tsx`:

```tsx
import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { TextureLoader, BackSide, SphereGeometry, MeshBasicMaterial } from 'three';
import * as THREE from 'three';
import { usePanoramaStore } from '@/stores/panoramaStore';
import { PanoramaControls } from './PanoramaControls';
import { PanoramaHotspot } from './PanoramaHotspot';
import { HotspotModal } from './HotspotModal';
import { PanoramaThumbnails } from './PanoramaThumbnails';

interface PanoramaViewerProps {
  projectId: string;
  initialPanoramaId?: string;
}

export function PanoramaViewer({ projectId, initialPanoramaId }: PanoramaViewerProps) {
  const {
    currentPanorama,
    isLoading,
    error,
    isTransitioning,
    activeHotspotId,
    setActiveHotspot,
  } = usePanoramaStore();

  // TODO: Fetch panoramas for project
  // useEffect(() => { ... }, [projectId]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Failed to load panorama</p>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 0.1] }}>
        {currentPanorama && (
          <PanoramaSphere
            imageUrl={currentPanorama.imageUrl}
            hotspots={currentPanorama.hotspots}
          />
        )}
        <PanoramaControls />
      </Canvas>

      {/* Transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black pointer-events-none animate-pulse" />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Thumbnails navigation */}
      <PanoramaThumbnails />

      {/* Hotspot modal */}
      {activeHotspotId && (
        <HotspotModal
          hotspotId={activeHotspotId}
          onClose={() => setActiveHotspot(null)}
        />
      )}
    </div>
  );
}

interface PanoramaSphereProps {
  imageUrl: string;
  hotspots: Hotspot[];
}

function PanoramaSphere({ imageUrl, hotspots }: PanoramaSphereProps) {
  const texture = useLoader(TextureLoader, imageUrl);
  const { yaw, pitch, fov } = usePanoramaStore();
  const { camera } = useThree();

  // Configure texture
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }, [texture]);

  // Update camera based on store
  useFrame(() => {
    const phi = THREE.MathUtils.degToRad(90 - pitch);
    const theta = THREE.MathUtils.degToRad(yaw);

    camera.position.set(0, 0, 0);
    camera.lookAt(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );

    if ((camera as THREE.PerspectiveCamera).fov !== fov) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return (
    <>
      {/* Panorama sphere */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial map={texture} side={BackSide} />
      </mesh>

      {/* Hotspots */}
      {hotspots.map((hotspot) => (
        <PanoramaHotspot key={hotspot.id} hotspot={hotspot} />
      ))}
    </>
  );
}

// Import Hotspot type
import type { Hotspot } from '@/types/panorama';
```

### 7.4 Create Panorama Controls

Create `client/src/features/panorama/PanoramaControls.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { usePanoramaStore } from '@/stores/panoramaStore';

export function PanoramaControls() {
  const { gl } = useThree();
  const { yaw, pitch, fov, setView, setFov } = usePanoramaStore();

  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastPosition.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: 0, y: 0 };
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;

      velocity.current = { x: deltaX, y: deltaY };

      const newYaw = yaw - deltaX * 0.2;
      const newPitch = Math.max(-85, Math.min(85, pitch + deltaY * 0.2));

      setView(newYaw, newPitch);
      lastPosition.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newFov = fov + e.deltaY * 0.05;
      setFov(newFov);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [gl, yaw, pitch, fov, setView, setFov]);

  // Momentum/inertia
  useFrame(() => {
    if (!isDragging.current && (Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.y) > 0.1)) {
      const newYaw = yaw - velocity.current.x * 0.2;
      const newPitch = Math.max(-85, Math.min(85, pitch + velocity.current.y * 0.2));

      setView(newYaw, newPitch);

      // Decay velocity
      velocity.current.x *= 0.95;
      velocity.current.y *= 0.95;
    }
  });

  return null;
}
```

### 7.5 Create Hotspot Component

Create `client/src/features/panorama/PanoramaHotspot.tsx`:

```tsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePanoramaStore } from '@/stores/panoramaStore';
import type { Hotspot } from '@/types/panorama';

const HOTSPOT_COLORS: Record<string, string> = {
  NAVIGATION: '#3b82f6',
  INFO: '#22c55e',
  MEDIA: '#a855f7',
  LINK: '#f59e0b',
};

interface PanoramaHotspotProps {
  hotspot: Hotspot;
}

export function PanoramaHotspot({ hotspot }: PanoramaHotspotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const {
    hoveredHotspotId,
    setHoveredHotspot,
    setActiveHotspot,
    navigateTo,
  } = usePanoramaStore();

  // Convert spherical to cartesian
  const position = sphericalToCartesian(hotspot.yaw, hotspot.pitch, 10);

  // Scale animation when hovered
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );

      // Always face camera
      meshRef.current.lookAt(0, 0, 0);
    }
  });

  const handleClick = () => {
    if (hotspot.type === 'NAVIGATION' && hotspot.targetId) {
      navigateTo(hotspot.targetId);
    } else {
      setActiveHotspot(hotspot.id);
    }
  };

  const color = hotspot.color || HOTSPOT_COLORS[hotspot.type] || '#ffffff';

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => {
        setHovered(true);
        setHoveredHotspot(hotspot.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveredHotspot(null);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Hotspot ring */}
      <ringGeometry args={[0.3, 0.5, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={hovered ? 1 : 0.8}
        side={THREE.DoubleSide}
      />

      {/* Inner circle */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pulse animation ring */}
      {hovered && (
        <mesh position={[0, 0, -0.01]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </mesh>
  );
}

function sphericalToCartesian(
  yaw: number,
  pitch: number,
  radius: number
): [number, number, number] {
  const phi = THREE.MathUtils.degToRad(90 - pitch);
  const theta = THREE.MathUtils.degToRad(yaw);

  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}
```

### 7.6 Create Hotspot Modal

Create `client/src/features/panorama/HotspotModal.tsx`:

```tsx
import { X, ExternalLink, Play } from 'lucide-react';
import { usePanoramaStore } from '@/stores/panoramaStore';

interface HotspotModalProps {
  hotspotId: string;
  onClose: () => void;
}

export function HotspotModal({ hotspotId, onClose }: HotspotModalProps) {
  const { currentPanorama } = usePanoramaStore();
  const hotspot = currentPanorama?.hotspots.find((h) => h.id === hotspotId);

  if (!hotspot || !hotspot.content) return null;

  const { title, description, url, mediaUrl, mediaType } = hotspot.content;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full mx-4 overflow-hidden">
        {/* Media */}
        {mediaUrl && (
          <div className="aspect-video bg-gray-900">
            {mediaType === 'video' ? (
              <video src={mediaUrl} controls className="w-full h-full" />
            ) : (
              <img
                src={mediaUrl}
                alt={title || 'Media'}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">{title || 'Information'}</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {description && (
            <p className="text-gray-300 mb-4">{description}</p>
          )}

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300"
            >
              <ExternalLink size={16} />
              Learn more
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 7.7 Create Panorama Thumbnails

Create `client/src/features/panorama/PanoramaThumbnails.tsx`:

```tsx
import { usePanoramaStore } from '@/stores/panoramaStore';

export function PanoramaThumbnails() {
  const { panoramas, currentPanorama, navigateTo } = usePanoramaStore();

  if (panoramas.length <= 1) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
        {panoramas.map((panorama) => (
          <button
            key={panorama.id}
            onClick={() => navigateTo(panorama.id)}
            className={`relative w-16 h-12 rounded overflow-hidden transition-all ${
              currentPanorama?.id === panorama.id
                ? 'ring-2 ring-primary-500 scale-105'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={panorama.thumbnailUrl || panorama.imageUrl}
              alt={panorama.name}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 7.8 Export Panorama Feature

Create `client/src/features/panorama/index.ts`:

```typescript
export { PanoramaViewer } from './PanoramaViewer';
export { PanoramaControls } from './PanoramaControls';
export { PanoramaHotspot } from './PanoramaHotspot';
export { HotspotModal } from './HotspotModal';
export { PanoramaThumbnails } from './PanoramaThumbnails';
```

---

## VR Support for Panoramas

For stereo panorama support in VR, the panorama needs to be rendered differently:

```tsx
// In PanoramaSphere, detect VR and use stereo texture
function PanoramaSphereVR({ stereoUrl }: { stereoUrl: string }) {
  // Stereo images are side-by-side (left eye | right eye)
  // Need to render different halves to each eye
  // This requires custom shader or two spheres with UV offset
}
```

This is advanced and can be implemented as a follow-up task.

---

## Verification Checklist

After completing Phase 7, verify:

- [ ] Panorama loads and displays correctly
- [ ] Mouse drag rotates view
- [ ] Scroll wheel zooms (FOV change)
- [ ] Hotspots are visible at correct positions
- [ ] Navigation hotspots switch panoramas
- [ ] Info/media/link hotspots open modal
- [ ] Thumbnails navigation works
- [ ] Smooth transitions between panoramas
- [ ] Works alongside 3D scene viewer in same project

---

## Next Phase

After Phase 7 is complete, proceed to **Phase 8: Ozone Integration Prep** which covers:
- Extracting shared types
- Aligning with Ozone patterns
- Preparing for monorepo migration

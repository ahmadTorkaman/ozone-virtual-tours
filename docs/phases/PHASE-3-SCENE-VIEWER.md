# Phase 3: Scene Viewer

> **Scope**: Core 3D viewer with local GLB loading and navigation
> **Prerequisites**: Phase 2 complete (database & file storage ready)
> **Outputs**: Functional 3D scene viewer with first-person controls

---

## Overview

This phase builds the core 3D viewing experience for the Tauri desktop app:

1. React Three Fiber (R3F) setup and configuration
2. GLB loading from local filesystem via Tauri
3. First-person camera controls (WASD + mouse)
4. Object selection via ray-casting
5. Scene state management with Zustand
6. Basic UI overlay (loading, controls help)

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer (Tauri desktop app)
- **Current State**: Phase 2 complete (SQLite database, file storage)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Building the 3D viewer with React Three Fiber
- **Key Difference from Web**: Files load from local filesystem, not URLs

Read `/docs/ARCHITECTURE.md` for full context.

---

## Dependencies to Install

```bash
cd client
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing
pnpm add -D @types/three
```

---

## Task Checklist

### 3.1 Tauri File URL Conversion

Create `client/src/lib/tauri-file.ts`:

```typescript
import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * Convert a local file path to a URL that can be used in the WebView.
 * Tauri uses the `asset://` protocol to serve local files securely.
 */
export function getAssetUrl(filePath: string): string {
  // convertFileSrc handles the platform-specific path conversion
  return convertFileSrc(filePath);
}

/**
 * Get the full path to a file in the app's data directory.
 * Combines with the base data path from settings.
 */
export function getProjectFilePath(
  dataPath: string,
  projectId: string,
  fileName: string
): string {
  // Windows uses backslashes, but we normalize to forward slashes
  return `${dataPath}/projects/${projectId}/${fileName}`.replace(/\\/g, '/');
}

/**
 * Get asset URL for a scene's GLB file.
 */
export function getSceneGlbUrl(dataPath: string, projectId: string, glbFileName: string): string {
  const filePath = getProjectFilePath(dataPath, projectId, glbFileName);
  return getAssetUrl(filePath);
}

/**
 * Get asset URL for a texture file.
 */
export function getTextureUrl(dataPath: string, projectId: string, texturePath: string): string {
  const filePath = getProjectFilePath(dataPath, projectId, texturePath);
  return getAssetUrl(filePath);
}
```

### 3.2 Create Three.js Engine Core

Create `client/src/engine/SceneManager.ts`:

```typescript
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export interface LoadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface SceneData {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  meshes: Map<string, THREE.Mesh>;
  materials: Map<string, THREE.Material>;
}

// Singleton DRACO loader
let dracoLoader: DRACOLoader | null = null;

function getDracoLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    // DRACO decoder files bundled with the app
    // These should be copied to public/draco/ during build
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' });
  }
  return dracoLoader;
}

/**
 * Load a GLB file from a local asset URL (converted via Tauri's convertFileSrc).
 * @param assetUrl - The asset:// URL from getAssetUrl()
 * @param onProgress - Optional progress callback
 */
export async function loadGLB(
  assetUrl: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<SceneData> {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(getDracoLoader());

  return new Promise((resolve, reject) => {
    loader.load(
      assetUrl,
      (gltf: GLTF) => {
        const meshes = new Map<string, THREE.Mesh>();
        const materials = new Map<string, THREE.Material>();

        // Traverse and catalog all meshes and materials
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Store mesh by name (or generate name if unnamed)
            const name = child.name || `mesh_${meshes.size}`;
            meshes.set(name, child);

            // Store original material
            if (child.material) {
              const mat = child.material as THREE.Material;
              if (!materials.has(mat.name)) {
                materials.set(mat.name || `material_${materials.size}`, mat);
              }
            }

            // Enable shadows
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        resolve({
          scene: gltf.scene,
          animations: gltf.animations,
          meshes,
          materials,
        });
      },
      (event) => {
        if (onProgress && event.total > 0) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          });
        }
      },
      (error) => {
        reject(new Error(`Failed to load GLB: ${error}`));
      }
    );
  });
}

export function disposeScene(sceneData: SceneData): void {
  sceneData.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material?.dispose();
      }
    }
  });

  sceneData.meshes.clear();
  sceneData.materials.clear();
}

/**
 * Get a list of all mesh names in the scene.
 * Useful for building the object hierarchy panel.
 */
export function getMeshList(sceneData: SceneData): string[] {
  return Array.from(sceneData.meshes.keys());
}

/**
 * Find a mesh by name in the scene data.
 */
export function getMeshByName(sceneData: SceneData, name: string): THREE.Mesh | undefined {
  return sceneData.meshes.get(name);
}
```

Create `client/src/engine/MaterialSystem.ts`:

```typescript
import * as THREE from 'three';
import { getAssetUrl } from '@/lib/tauri-file';

export interface PhysicalMaterialParams {
  color?: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;

  // Clearcoat
  clearcoat?: number;
  clearcoatRoughness?: number;

  // Sheen
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: string;

  // Transmission
  transmission?: number;
  thickness?: number;
  ior?: number;

  // Iridescence
  iridescence?: number;
  iridescenceIOR?: number;

  // Anisotropy
  anisotropy?: number;
  anisotropyRotation?: number;

  // Texture file paths (local paths, will be converted to asset URLs)
  mapPath?: string;
  normalMapPath?: string;
  roughnessMapPath?: string;
  metalnessMapPath?: string;
  aoMapPath?: string;
  emissiveMapPath?: string;
}

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

/**
 * Load a texture from a local file path.
 * @param filePath - Local file path (will be converted to asset:// URL)
 */
async function loadTexture(filePath: string): Promise<THREE.Texture> {
  const assetUrl = getAssetUrl(filePath);

  if (textureCache.has(assetUrl)) {
    return textureCache.get(assetUrl)!;
  }

  return new Promise((resolve, reject) => {
    textureLoader.load(
      assetUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        textureCache.set(assetUrl, texture);
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

export async function createPhysicalMaterial(
  params: PhysicalMaterialParams
): Promise<THREE.MeshPhysicalMaterial> {
  const material = new THREE.MeshPhysicalMaterial({
    color: params.color ? new THREE.Color(params.color) : undefined,
    metalness: params.metalness ?? 0,
    roughness: params.roughness ?? 1,
    opacity: params.opacity ?? 1,
    transparent: params.transparent ?? false,

    clearcoat: params.clearcoat ?? 0,
    clearcoatRoughness: params.clearcoatRoughness ?? 0,

    sheen: params.sheen ?? 0,
    sheenRoughness: params.sheenRoughness ?? 1,
    sheenColor: params.sheenColor ? new THREE.Color(params.sheenColor) : undefined,

    transmission: params.transmission ?? 0,
    thickness: params.thickness ?? 0,
    ior: params.ior ?? 1.5,

    iridescence: params.iridescence ?? 0,
    iridescenceIOR: params.iridescenceIOR ?? 1.3,

    anisotropy: params.anisotropy ?? 0,
    anisotropyRotation: params.anisotropyRotation ?? 0,
  });

  // Load textures in parallel
  const texturePromises: Promise<void>[] = [];

  if (params.mapPath) {
    texturePromises.push(
      loadTexture(params.mapPath).then((t) => {
        material.map = t;
      })
    );
  }

  if (params.normalMapPath) {
    texturePromises.push(
      loadTexture(params.normalMapPath).then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        material.normalMap = t;
      })
    );
  }

  if (params.roughnessMapPath) {
    texturePromises.push(
      loadTexture(params.roughnessMapPath).then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        material.roughnessMap = t;
      })
    );
  }

  if (params.metalnessMapPath) {
    texturePromises.push(
      loadTexture(params.metalnessMapPath).then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        material.metalnessMap = t;
      })
    );
  }

  if (params.aoMapPath) {
    texturePromises.push(
      loadTexture(params.aoMapPath).then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        material.aoMap = t;
      })
    );
  }

  if (params.emissiveMapPath) {
    texturePromises.push(
      loadTexture(params.emissiveMapPath).then((t) => {
        material.emissiveMap = t;
        material.emissive = new THREE.Color(0xffffff);
      })
    );
  }

  await Promise.all(texturePromises);
  material.needsUpdate = true;

  return material;
}

export function applyMaterialToMesh(
  mesh: THREE.Mesh,
  material: THREE.Material
): THREE.Material | null {
  const oldMaterial = mesh.material as THREE.Material;
  mesh.material = material;
  return oldMaterial;
}

export function clearTextureCache(): void {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
}
```

Create `client/src/engine/controls/FirstPersonControls.ts`:

```typescript
import * as THREE from 'three';

export interface FirstPersonControlsConfig {
  moveSpeed: number;
  lookSpeed: number;
  eyeHeight: number;
  enableCollision: boolean;
}

const DEFAULT_CONFIG: FirstPersonControlsConfig = {
  moveSpeed: 5,
  lookSpeed: 0.002,
  eyeHeight: 1.6,
  enableCollision: false, // Will be enabled in future phase
};

export class FirstPersonControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private config: FirstPersonControlsConfig;

  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();

  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;

  private isLocked = false;
  private enabled = true;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    config: Partial<FirstPersonControlsConfig> = {}
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.bindEvents();
  }

  private bindEvents(): void {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('click', this.onClick);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  private onClick = (): void => {
    if (!this.isLocked && this.enabled) {
      this.domElement.requestPointerLock();
    }
  };

  private onPointerLockChange = (): void => {
    this.isLocked = document.pointerLockElement === this.domElement;
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || !this.isLocked) return;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'Space':
        this.moveUp = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = true;
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'Space':
        this.moveUp = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = false;
        break;
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || !this.isLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= movementX * this.config.lookSpeed;
    this.euler.x -= movementY * this.config.lookSpeed;

    // Clamp vertical rotation
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  };

  update(delta: number): void {
    if (!this.enabled) return;

    const speed = this.config.moveSpeed * delta;

    this.velocity.x = 0;
    this.velocity.y = 0;
    this.velocity.z = 0;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.y = Number(this.moveUp) - Number(this.moveDown);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * speed;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x += this.direction.x * speed;
    }
    if (this.moveUp || this.moveDown) {
      this.velocity.y += this.direction.y * speed;
    }

    // Move relative to camera orientation (horizontal plane only for XZ)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    this.camera.position.addScaledVector(forward, -this.velocity.z);
    this.camera.position.addScaledVector(right, this.velocity.x);
    this.camera.position.y += this.velocity.y;
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y + this.config.eyeHeight, z);
  }

  setRotation(x: number, y: number, z: number): void {
    this.euler.set(x, y, z, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
  }

  lock(): void {
    this.domElement.requestPointerLock();
  }

  unlock(): void {
    document.exitPointerLock();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.moveForward = false;
      this.moveBackward = false;
      this.moveLeft = false;
      this.moveRight = false;
      this.moveUp = false;
      this.moveDown = false;
    }
  }

  getIsLocked(): boolean {
    return this.isLocked;
  }

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('click', this.onClick);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}
```

### 3.3 Create Zustand Store for Scene State

Create `client/src/stores/sceneStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SceneData } from '@/engine/SceneManager';

interface SceneState {
  // Current project/scene info
  currentProjectId: string | null;
  currentSceneId: string | null;

  // Scene data
  sceneData: SceneData | null;
  isLoading: boolean;
  loadProgress: number;
  error: string | null;

  // Selection
  selectedObjectName: string | null;
  hoveredObjectName: string | null;

  // Camera
  isPointerLocked: boolean;

  // Material mappings (objectName -> materialId)
  materialMappings: Record<string, string>;

  // Actions
  setCurrentProject: (projectId: string | null) => void;
  setCurrentScene: (sceneId: string | null) => void;
  setSceneData: (data: SceneData | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setSelectedObject: (name: string | null) => void;
  setHoveredObject: (name: string | null) => void;
  setPointerLocked: (locked: boolean) => void;
  setMaterialMapping: (objectName: string, materialId: string) => void;
  setMaterialMappings: (mappings: Record<string, string>) => void;
  removeMaterialMapping: (objectName: string) => void;
  clearMaterialMappings: () => void;
  reset: () => void;
}

const initialState = {
  currentProjectId: null,
  currentSceneId: null,
  sceneData: null,
  isLoading: false,
  loadProgress: 0,
  error: null,
  selectedObjectName: null,
  hoveredObjectName: null,
  isPointerLocked: false,
  materialMappings: {},
};

export const useSceneStore = create<SceneState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

      setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),

      setSceneData: (data) => set({ sceneData: data, error: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setLoadProgress: (progress) => set({ loadProgress: progress }),

      setError: (error) => set({ error, isLoading: false }),

      setSelectedObject: (name) => set({ selectedObjectName: name }),

      setHoveredObject: (name) => set({ hoveredObjectName: name }),

      setPointerLocked: (locked) => set({ isPointerLocked: locked }),

      setMaterialMapping: (objectName, materialId) =>
        set((state) => ({
          materialMappings: {
            ...state.materialMappings,
            [objectName]: materialId,
          },
        })),

      setMaterialMappings: (mappings) => set({ materialMappings: mappings }),

      removeMaterialMapping: (objectName) =>
        set((state) => {
          const { [objectName]: _, ...rest } = state.materialMappings;
          return { materialMappings: rest };
        }),

      clearMaterialMappings: () => set({ materialMappings: {} }),

      reset: () => set(initialState),
    }),
    { name: 'scene-store' }
  )
);
```

### 3.4 Create React Three Fiber Components

Create `client/src/features/scene-viewer/SceneViewer.tsx`:

```tsx
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stats, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/stores/sceneStore';
import { loadGLB, disposeScene } from '@/engine/SceneManager';
import { FirstPersonControls } from '@/engine/controls/FirstPersonControls';
import { LoadingOverlay } from './LoadingOverlay';
import { ControlsHelp } from './ControlsHelp';
import { SelectionOutline } from './SelectionOutline';

interface SceneViewerProps {
  /** Asset URL from getAssetUrl() - already converted from file path */
  sceneUrl: string;
  spawnPosition?: { x: number; y: number; z: number };
  spawnRotation?: { x: number; y: number; z: number };
  onObjectSelect?: (objectName: string | null) => void;
}

export function SceneViewer({
  sceneUrl,
  spawnPosition = { x: 0, y: 0, z: 0 },
  spawnRotation = { x: 0, y: 0, z: 0 },
  onObjectSelect,
}: SceneViewerProps) {
  const {
    isLoading,
    loadProgress,
    error,
    isPointerLocked,
    setSceneData,
    setLoading,
    setLoadProgress,
    setError,
    reset,
  } = useSceneStore();

  const [showHelp, setShowHelp] = useState(true);

  // Load scene on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadProgress(0);
      setError(null);

      try {
        const data = await loadGLB(sceneUrl, (progress) => {
          if (!cancelled) {
            setLoadProgress(progress.percent);
          }
        });

        if (!cancelled) {
          setSceneData(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load scene');
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      const { sceneData } = useSceneStore.getState();
      if (sceneData) {
        disposeScene(sceneData);
      }
      reset();
    };
  }, [sceneUrl]);

  // Hide help after pointer lock
  useEffect(() => {
    if (isPointerLocked) {
      const timer = setTimeout(() => setShowHelp(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isPointerLocked]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Failed to load scene</p>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: [spawnPosition.x, spawnPosition.y + 1.6, spawnPosition.z],
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            spawnPosition={spawnPosition}
            spawnRotation={spawnRotation}
            onObjectSelect={onObjectSelect}
          />
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      {isLoading && <LoadingOverlay progress={loadProgress} />}

      {/* Controls help */}
      {showHelp && !isLoading && <ControlsHelp />}

      {/* Dev stats */}
      {import.meta.env.DEV && (
        <div className="absolute top-0 left-0">
          <Stats />
        </div>
      )}
    </div>
  );
}

interface SceneContentProps {
  spawnPosition: { x: number; y: number; z: number };
  spawnRotation: { x: number; y: number; z: number };
  onObjectSelect?: (objectName: string | null) => void;
}

function SceneContent({
  spawnPosition,
  spawnRotation,
  onObjectSelect,
}: SceneContentProps) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<FirstPersonControls | null>(null);
  const { sceneData, setPointerLocked, setSelectedObject, setHoveredObject } =
    useSceneStore();

  // Initialize controls
  useEffect(() => {
    if (!controlsRef.current) {
      controlsRef.current = new FirstPersonControls(
        camera as THREE.PerspectiveCamera,
        gl.domElement,
        { moveSpeed: 5, lookSpeed: 0.002, eyeHeight: 1.6 }
      );

      controlsRef.current.setPosition(
        spawnPosition.x,
        spawnPosition.y,
        spawnPosition.z
      );
      controlsRef.current.setRotation(
        spawnRotation.x,
        spawnRotation.y,
        spawnRotation.z
      );
    }

    // Pointer lock state sync
    const checkLock = () => {
      setPointerLocked(document.pointerLockElement === gl.domElement);
    };
    document.addEventListener('pointerlockchange', checkLock);

    return () => {
      document.removeEventListener('pointerlockchange', checkLock);
      controlsRef.current?.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl.domElement, spawnPosition, spawnRotation, setPointerLocked]);

  // Update controls each frame
  useFrame((_, delta) => {
    controlsRef.current?.update(delta);
  });

  // Handle object click
  const handleClick = (event: THREE.Event) => {
    if (!controlsRef.current?.getIsLocked()) return;

    const intersection = event as unknown as { object?: THREE.Object3D };
    if (intersection.object instanceof THREE.Mesh) {
      const name = intersection.object.name;
      setSelectedObject(name);
      onObjectSelect?.(name);
    }
  };

  // Handle object hover
  const handlePointerOver = (event: THREE.Event) => {
    const intersection = event as unknown as { object?: THREE.Object3D };
    if (intersection.object instanceof THREE.Mesh) {
      setHoveredObject(intersection.object.name);
      gl.domElement.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
    gl.domElement.style.cursor = 'default';
  };

  if (!sceneData) return null;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Environment for reflections */}
      <Environment preset="apartment" background={false} />

      {/* Scene content */}
      <primitive
        object={sceneData.scene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Selection outline */}
      <SelectionOutline />
    </>
  );
}
```

Create `client/src/features/scene-viewer/LoadingOverlay.tsx`:

```tsx
interface LoadingOverlayProps {
  progress: number;
}

export function LoadingOverlay({ progress }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
      <div className="text-center">
        <h2 className="text-xl text-white mb-4">Loading Scene</h2>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-gray-400 mt-2">{progress}%</p>
      </div>
    </div>
  );
}
```

Create `client/src/features/scene-viewer/ControlsHelp.tsx`:

```tsx
import { useSceneStore } from '@/stores/sceneStore';

export function ControlsHelp() {
  const { isPointerLocked } = useSceneStore();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-6 py-4 text-white">
      {!isPointerLocked ? (
        <p className="text-center">
          <span className="text-primary-400">Click</span> to start exploring
        </p>
      ) : (
        <div className="flex gap-8 text-sm">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">W A S D</kbd>
            <span className="text-gray-300">Move</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Mouse</kbd>
            <span className="text-gray-300">Look</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Space</kbd>
            <span className="text-gray-300">Up</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Esc</kbd>
            <span className="text-gray-300">Exit</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

Create `client/src/features/scene-viewer/SelectionOutline.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@/stores/sceneStore';

export function SelectionOutline() {
  const { scene } = useThree();
  const outlineRef = useRef<THREE.LineSegments | null>(null);
  const { selectedObjectName, sceneData } = useSceneStore();

  useEffect(() => {
    // Cleanup old outline
    if (outlineRef.current) {
      scene.remove(outlineRef.current);
      outlineRef.current.geometry.dispose();
      (outlineRef.current.material as THREE.Material).dispose();
      outlineRef.current = null;
    }

    // Create new outline for selected object
    if (selectedObjectName && sceneData) {
      const mesh = sceneData.meshes.get(selectedObjectName);
      if (mesh) {
        const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
        );

        // Match transform
        line.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
        line.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
        line.scale.copy(mesh.getWorldScale(new THREE.Vector3()));

        scene.add(line);
        outlineRef.current = line;
      }
    }

    return () => {
      if (outlineRef.current) {
        scene.remove(outlineRef.current);
        outlineRef.current.geometry.dispose();
        (outlineRef.current.material as THREE.Material).dispose();
      }
    };
  }, [selectedObjectName, sceneData, scene]);

  // Update outline position each frame (in case object moves)
  useFrame(() => {
    if (outlineRef.current && selectedObjectName && sceneData) {
      const mesh = sceneData.meshes.get(selectedObjectName);
      if (mesh) {
        outlineRef.current.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
        outlineRef.current.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
        outlineRef.current.scale.copy(mesh.getWorldScale(new THREE.Vector3()));
      }
    }
  });

  return null;
}
```

Create `client/src/features/scene-viewer/ObjectHierarchy.tsx`:

```tsx
import { useMemo } from 'react';
import { useSceneStore } from '@/stores/sceneStore';

interface ObjectHierarchyProps {
  onSelectObject?: (name: string) => void;
}

export function ObjectHierarchy({ onSelectObject }: ObjectHierarchyProps) {
  const { sceneData, selectedObjectName, setSelectedObject } = useSceneStore();

  const objectList = useMemo(() => {
    if (!sceneData) return [];
    return Array.from(sceneData.meshes.keys()).sort();
  }, [sceneData]);

  const handleSelect = (name: string) => {
    setSelectedObject(name);
    onSelectObject?.(name);
  };

  if (!sceneData) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        No scene loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-white">
          Objects ({objectList.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {objectList.map((name) => (
            <button
              key={name}
              className={`w-full text-left px-3 py-2 rounded text-sm truncate ${
                selectedObjectName === name
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => handleSelect(name)}
              title={name}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Create `client/src/features/scene-viewer/index.ts`:

```typescript
export { SceneViewer } from './SceneViewer';
export { LoadingOverlay } from './LoadingOverlay';
export { ControlsHelp } from './ControlsHelp';
export { SelectionOutline } from './SelectionOutline';
export { ObjectHierarchy } from './ObjectHierarchy';
```

### 3.5 Create Scene Editor Page

Create `client/src/pages/SceneEditor.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SceneViewer, ObjectHierarchy } from '@/features/scene-viewer';
import { useSceneStore } from '@/stores/sceneStore';
import { getSceneGlbUrl } from '@/lib/tauri-file';
import { invoke } from '@tauri-apps/api/core';

interface Scene {
  id: string;
  name: string;
  glb_path: string;
  spawn_position: { x: number; y: number; z: number } | null;
  spawn_rotation: { x: number; y: number; z: number } | null;
}

interface Project {
  id: string;
  name: string;
}

export function SceneEditor() {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>();
  const navigate = useNavigate();

  const [scene, setScene] = useState<Scene | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [dataPath, setDataPath] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(true);

  const { selectedObjectName, setCurrentProject, setCurrentScene } = useSceneStore();

  // Load scene data
  useEffect(() => {
    async function loadData() {
      if (!projectId || !sceneId) return;

      try {
        // Get data path from settings
        const settings = await invoke<{ data_path: string }>('get_settings');
        setDataPath(settings.data_path);

        // Load project and scene
        const [projectData, sceneData] = await Promise.all([
          invoke<Project>('get_project', { id: projectId }),
          invoke<Scene>('get_scene', { id: sceneId }),
        ]);

        setProject(projectData);
        setScene(sceneData);
        setCurrentProject(projectId);
        setCurrentScene(sceneId);
      } catch (error) {
        console.error('Failed to load scene:', error);
      }
    }

    loadData();

    return () => {
      setCurrentProject(null);
      setCurrentScene(null);
    };
  }, [projectId, sceneId, setCurrentProject, setCurrentScene]);

  if (!scene || !project || !dataPath) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  const sceneUrl = getSceneGlbUrl(dataPath, projectId!, scene.glb_path);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            &larr; Back
          </button>
          <h1 className="text-white font-medium">
            {project.name} / {scene.name}
          </h1>
        </div>

        <button
          className="text-gray-400 hover:text-white text-sm"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? 'Hide' : 'Show'} Sidebar
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scene viewer */}
        <div className="flex-1 relative">
          <SceneViewer
            sceneUrl={sceneUrl}
            spawnPosition={scene.spawn_position ?? { x: 0, y: 0, z: 5 }}
            spawnRotation={scene.spawn_rotation ?? { x: 0, y: 0, z: 0 }}
          />
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Selected object info */}
            {selectedObjectName && (
              <div className="p-4 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Selected</p>
                <p className="text-white font-medium truncate" title={selectedObjectName}>
                  {selectedObjectName}
                </p>
              </div>
            )}

            {/* Object hierarchy */}
            <div className="flex-1 overflow-hidden">
              <ObjectHierarchy />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
```

### 3.6 DRACO Decoder Setup

Copy DRACO decoder files to the client public folder:

```bash
# Create draco directory
mkdir -p client/public/draco

# Download DRACO decoders (or copy from node_modules)
# Option 1: Copy from three.js examples
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.js client/public/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.wasm client/public/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_wasm_wrapper.js client/public/draco/

# Option 2: Download from CDN and save locally
curl -o client/public/draco/draco_decoder.js https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.js
curl -o client/public/draco/draco_decoder.wasm https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.wasm
curl -o client/public/draco/draco_wasm_wrapper.js https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_wasm_wrapper.js
```

### 3.7 Tauri Configuration for Assets

Update `src-tauri/tauri.conf.json` to allow asset protocol:

```json
{
  "security": {
    "csp": "default-src 'self'; img-src 'self' asset: data:; script-src 'self'; style-src 'self' 'unsafe-inline'",
    "assetProtocol": {
      "enable": true,
      "scope": ["$DOCUMENT/*", "$APPDATA/*"]
    }
  }
}
```

---

## Testing the Viewer

1. Create a test project in the database with a GLB file
2. Run `pnpm tauri dev`
3. Navigate to `/projects/{projectId}/scenes/{sceneId}`
4. Click to enter pointer lock mode
5. Use WASD to move, mouse to look
6. Click objects to select them

---

## Verification Checklist

After completing Phase 3, verify:

- [ ] Scene loads from local filesystem via asset:// protocol
- [ ] Progress indicator shows during load
- [ ] First-person controls work (WASD + mouse)
- [ ] Pointer lock activates on click
- [ ] ESC exits pointer lock
- [ ] Objects can be clicked to select
- [ ] Selected object shows green outline
- [ ] Object hierarchy panel lists all meshes
- [ ] Selecting from panel highlights object
- [ ] No console errors during interaction

---

## Performance Notes

For large scenes (500MB+ GLB files):

1. **DRACO compression** - Enabled by default, decoders bundled locally
2. **Frustum culling** - Three.js handles this automatically
3. **Memory management** - Scenes properly disposed on unmount
4. **Texture caching** - Textures cached to avoid reloading

Future optimizations (later phases):
- LOD generation for detailed models
- Occlusion culling for interior scenes
- Progressive loading for very large files

---

## Next Phase

After Phase 3 is complete, proceed to **Phase 4: Material System** which covers:
- Material library UI (local SQLite)
- Material editor with full PBR controls
- Applying materials to selected objects
- Saving material mappings to database

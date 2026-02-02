# Phase 5: VR Mode (WebXR)

> **Scope**: WebXR integration with VR controls and UI
> **Prerequisites**: Phase 4 complete (material system working)
> **Outputs**: Immersive VR experience via WebXR in Tauri WebView

---

## Overview

This phase adds immersive VR support using WebXR in the Tauri WebView:

1. WebXR session management (enter/exit VR)
2. VR locomotion (teleport and smooth movement)
3. Controller-based interaction (ray-casting, object selection)
4. VR UI panels (floating menus for materials)
5. Comfort options (vignette, snap turning)

### Hybrid VR Strategy

**v1.0 (This Phase)**: WebXR in Tauri WebView
- Works with most VR headsets via browser WebXR
- Simpler implementation, faster to market
- Performance limited by WebView

**v2.0 (Future)**: Native OpenXR via Rust
- Direct OpenXR integration in Rust backend
- Optimal performance, full feature access
- Requires significant additional development

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer (Tauri desktop app)
- **Current State**: Phase 4 complete (scene viewer + material system)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Adding WebXR VR support in WebView
- **VR Approach**: WebXR for v1.0, native OpenXR planned for v2.0

VR is a **critical feature** for this application. Interior designers use VR headsets to present designs to clients.

Read `/docs/ARCHITECTURE.md` for full context.

---

## Dependencies

```bash
cd client
pnpm add @react-three/xr
```

---

## Task Checklist

### 5.1 Create VR Session Manager

Create `client/src/engine/vr/VRSession.ts`:

```typescript
import * as THREE from 'three';

export interface VRSessionConfig {
  referenceSpaceType: XRReferenceSpaceType;
  optionalFeatures?: string[];
  requiredFeatures?: string[];
}

const DEFAULT_CONFIG: VRSessionConfig = {
  referenceSpaceType: 'local-floor',
  optionalFeatures: ['hand-tracking', 'layers'],
  requiredFeatures: ['local-floor'],
};

export class VRSessionManager {
  private renderer: THREE.WebGLRenderer;
  private session: XRSession | null = null;
  private config: VRSessionConfig;

  private onSessionStart?: () => void;
  private onSessionEnd?: () => void;

  constructor(
    renderer: THREE.WebGLRenderer,
    config: Partial<VRSessionConfig> = {}
  ) {
    this.renderer = renderer;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async isSupported(): Promise<boolean> {
    if (!navigator.xr) return false;
    return navigator.xr.isSessionSupported('immersive-vr');
  }

  async enterVR(): Promise<void> {
    if (!navigator.xr) {
      throw new Error('WebXR not supported');
    }

    if (this.session) {
      console.warn('VR session already active');
      return;
    }

    try {
      this.session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: this.config.optionalFeatures,
        requiredFeatures: this.config.requiredFeatures,
      });

      this.session.addEventListener('end', this.handleSessionEnd);

      await this.renderer.xr.setSession(this.session);
      this.renderer.xr.enabled = true;

      this.onSessionStart?.();
    } catch (error) {
      console.error('Failed to enter VR:', error);
      throw error;
    }
  }

  exitVR(): void {
    if (this.session) {
      this.session.end();
    }
  }

  private handleSessionEnd = (): void => {
    this.session = null;
    this.renderer.xr.enabled = false;
    this.onSessionEnd?.();
  };

  isInVR(): boolean {
    return this.session !== null;
  }

  setCallbacks(onStart?: () => void, onEnd?: () => void): void {
    this.onSessionStart = onStart;
    this.onSessionEnd = onEnd;
  }

  getSession(): XRSession | null {
    return this.session;
  }

  dispose(): void {
    this.exitVR();
  }
}
```

### 5.2 Create VR Controls

Create `client/src/engine/vr/VRControls.ts`:

```typescript
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export type LocomotionMode = 'teleport' | 'smooth' | 'none';

export interface VRControlsConfig {
  locomotionMode: LocomotionMode;
  smoothSpeed: number;
  snapTurnAngle: number;
  teleportDistance: number;
}

const DEFAULT_CONFIG: VRControlsConfig = {
  locomotionMode: 'teleport',
  smoothSpeed: 3,
  snapTurnAngle: 45,
  teleportDistance: 10,
};

export class VRControls {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private cameraGroup: THREE.Group;
  private config: VRControlsConfig;

  private controllers: THREE.XRTargetRaySpace[] = [];
  private controllerGrips: THREE.XRGripSpace[] = [];
  private raycaster = new THREE.Raycaster();

  private teleportMarker: THREE.Mesh | null = null;
  private teleportLine: THREE.Line | null = null;
  private teleportTarget: THREE.Vector3 | null = null;

  private onSelectStart?: (controller: THREE.XRTargetRaySpace, intersection?: THREE.Intersection) => void;
  private onSelectEnd?: (controller: THREE.XRTargetRaySpace) => void;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    cameraGroup: THREE.Group,
    config: Partial<VRControlsConfig> = {}
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.cameraGroup = cameraGroup;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.setupControllers();
    this.setupTeleportVisuals();
  }

  private setupControllers(): void {
    const controllerModelFactory = new XRControllerModelFactory();

    for (let i = 0; i < 2; i++) {
      // Controller ray
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', this.onControllerSelectStart);
      controller.addEventListener('selectend', this.onControllerSelectEnd);
      this.cameraGroup.add(controller);
      this.controllers.push(controller);

      // Controller model
      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(controllerModelFactory.createControllerModel(grip));
      this.cameraGroup.add(grip);
      this.controllerGrips.push(grip);

      // Ray visual
      const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
      ]);
      const rayMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const ray = new THREE.Line(rayGeometry, rayMaterial);
      ray.scale.z = 5;
      controller.add(ray);
    }
  }

  private setupTeleportVisuals(): void {
    // Teleport marker (ring on floor)
    const markerGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
    markerGeometry.rotateX(-Math.PI / 2);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
    });
    this.teleportMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    this.teleportMarker.visible = false;
    this.scene.add(this.teleportMarker);

    // Teleport arc line
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
    });
    this.teleportLine = new THREE.Line(lineGeometry, lineMaterial);
    this.teleportLine.visible = false;
    this.scene.add(this.teleportLine);
  }

  private onControllerSelectStart = (event: THREE.Event): void => {
    const controller = event.target as THREE.XRTargetRaySpace;

    if (this.config.locomotionMode === 'teleport') {
      this.startTeleportAim();
    }

    const intersection = this.getControllerIntersection(controller);
    this.onSelectStart?.(controller, intersection);
  };

  private onControllerSelectEnd = (event: THREE.Event): void => {
    const controller = event.target as THREE.XRTargetRaySpace;

    if (this.config.locomotionMode === 'teleport' && this.teleportTarget) {
      this.executeTeleport();
    }

    this.onSelectEnd?.(controller);
  };

  private startTeleportAim(): void {
    this.teleportMarker!.visible = true;
    this.teleportLine!.visible = true;
  }

  private updateTeleportAim(controller: THREE.XRTargetRaySpace): void {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // Find floor intersection (Y=0 is floor)
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(floorPlane, intersection)) {
      const distance = intersection.distanceTo(this.raycaster.ray.origin);

      if (distance <= this.config.teleportDistance) {
        this.teleportTarget = intersection;
        this.teleportMarker!.position.copy(intersection);
        this.teleportMarker!.position.y = 0.01;

        const points = [
          this.raycaster.ray.origin.clone(),
          intersection.clone(),
        ];
        this.teleportLine!.geometry.setFromPoints(points);

        (this.teleportMarker!.material as THREE.MeshBasicMaterial).color.setHex(0x00ff00);
      } else {
        (this.teleportMarker!.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
        this.teleportTarget = null;
      }
    }
  }

  private executeTeleport(): void {
    if (this.teleportTarget) {
      const offset = new THREE.Vector3();
      offset.copy(this.camera.position);
      offset.y = 0;

      this.cameraGroup.position.copy(this.teleportTarget).sub(offset);
    }

    this.teleportMarker!.visible = false;
    this.teleportLine!.visible = false;
    this.teleportTarget = null;
  }

  private getControllerIntersection(controller: THREE.XRTargetRaySpace): THREE.Intersection | undefined {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    return intersects.find(i => i.object instanceof THREE.Mesh);
  }

  update(): void {
    if (this.teleportMarker?.visible) {
      const controller = this.controllers[1];
      if (controller) {
        this.updateTeleportAim(controller);
      }
    }

    // Smooth locomotion using thumbstick
    if (this.config.locomotionMode === 'smooth') {
      const session = this.renderer.xr.getSession();
      if (session) {
        for (const source of session.inputSources) {
          if (source.gamepad) {
            const axes = source.gamepad.axes;
            if (source.handedness === 'left' && axes.length >= 4) {
              const moveX = axes[2];
              const moveZ = axes[3];

              if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
                const speed = this.config.smoothSpeed * 0.016;
                const direction = new THREE.Vector3(moveX, 0, moveZ);
                direction.applyQuaternion(this.camera.quaternion);
                direction.y = 0;
                direction.normalize();

                this.cameraGroup.position.addScaledVector(direction, speed);
              }
            }

            if (source.handedness === 'right' && axes.length >= 4) {
              const turnX = axes[2];

              if (Math.abs(turnX) > 0.5) {
                const turnAngle = Math.sign(turnX) * THREE.MathUtils.degToRad(this.config.snapTurnAngle);
                this.cameraGroup.rotateY(-turnAngle);
              }
            }
          }
        }
      }
    }
  }

  setCallbacks(
    onSelectStart?: (controller: THREE.XRTargetRaySpace, intersection?: THREE.Intersection) => void,
    onSelectEnd?: (controller: THREE.XRTargetRaySpace) => void
  ): void {
    this.onSelectStart = onSelectStart;
    this.onSelectEnd = onSelectEnd;
  }

  setLocomotionMode(mode: LocomotionMode): void {
    this.config.locomotionMode = mode;
  }

  dispose(): void {
    for (const controller of this.controllers) {
      controller.removeEventListener('selectstart', this.onControllerSelectStart);
      controller.removeEventListener('selectend', this.onControllerSelectEnd);
      this.cameraGroup.remove(controller);
    }

    for (const grip of this.controllerGrips) {
      this.cameraGroup.remove(grip);
    }

    if (this.teleportMarker) {
      this.scene.remove(this.teleportMarker);
      this.teleportMarker.geometry.dispose();
      (this.teleportMarker.material as THREE.Material).dispose();
    }

    if (this.teleportLine) {
      this.scene.remove(this.teleportLine);
      this.teleportLine.geometry.dispose();
      (this.teleportLine.material as THREE.Material).dispose();
    }
  }
}
```

### 5.3 Create VR Store

Create `client/src/stores/vrStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LocomotionMode } from '@/engine/vr/VRControls';

interface VRState {
  // Session state
  isSupported: boolean;
  isInVR: boolean;
  isEntering: boolean;

  // Settings (persisted)
  locomotionMode: LocomotionMode;
  smoothSpeed: number;
  snapTurnAngle: number;
  vignetteEnabled: boolean;

  // Actions
  setSupported: (supported: boolean) => void;
  setInVR: (inVR: boolean) => void;
  setEntering: (entering: boolean) => void;
  setLocomotionMode: (mode: LocomotionMode) => void;
  setSmoothSpeed: (speed: number) => void;
  setSnapTurnAngle: (angle: number) => void;
  setVignetteEnabled: (enabled: boolean) => void;
}

export const useVRStore = create<VRState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        isSupported: false,
        isInVR: false,
        isEntering: false,
        locomotionMode: 'teleport',
        smoothSpeed: 3,
        snapTurnAngle: 45,
        vignetteEnabled: true,

        // Actions
        setSupported: (supported) => set({ isSupported: supported }),
        setInVR: (inVR) => set({ isInVR: inVR }),
        setEntering: (entering) => set({ isEntering: entering }),
        setLocomotionMode: (mode) => set({ locomotionMode: mode }),
        setSmoothSpeed: (speed) => set({ smoothSpeed: speed }),
        setSnapTurnAngle: (angle) => set({ snapTurnAngle: angle }),
        setVignetteEnabled: (enabled) => set({ vignetteEnabled: enabled }),
      }),
      {
        name: 'vr-settings',
        partialize: (state) => ({
          locomotionMode: state.locomotionMode,
          smoothSpeed: state.smoothSpeed,
          snapTurnAngle: state.snapTurnAngle,
          vignetteEnabled: state.vignetteEnabled,
        }),
      }
    ),
    { name: 'vr-store' }
  )
);
```

### 5.4 Create VR Components

Create `client/src/features/vr/VRButton.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Headset } from 'lucide-react';
import { useVRStore } from '@/stores/vrStore';
import { VRSessionManager } from '@/engine/vr/VRSession';

export function VRButton() {
  const { gl } = useThree();
  const vrManagerRef = useRef<VRSessionManager | null>(null);
  const { isSupported, isInVR, isEntering, setSupported, setInVR, setEntering } = useVRStore();

  useEffect(() => {
    vrManagerRef.current = new VRSessionManager(gl);
    vrManagerRef.current.setCallbacks(
      () => setInVR(true),
      () => setInVR(false)
    );

    vrManagerRef.current.isSupported().then(setSupported);

    return () => {
      vrManagerRef.current?.dispose();
    };
  }, [gl, setSupported, setInVR]);

  const handleClick = async () => {
    if (!vrManagerRef.current || !isSupported) return;

    if (isInVR) {
      vrManagerRef.current.exitVR();
    } else {
      setEntering(true);
      try {
        await vrManagerRef.current.enterVR();
      } catch (error) {
        console.error('Failed to enter VR:', error);
      } finally {
        setEntering(false);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isEntering}
      className={`absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isInVR
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-primary-600 hover:bg-primary-700 text-white'
      } disabled:opacity-50`}
    >
      <Headset size={20} />
      {isEntering ? 'Entering VR...' : isInVR ? 'Exit VR' : 'Enter VR'}
    </button>
  );
}
```

Create `client/src/features/vr/VRSettings.tsx`:

```tsx
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useVRStore } from '@/stores/vrStore';
import type { LocomotionMode } from '@/engine/vr/VRControls';

export function VRSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isSupported,
    locomotionMode,
    smoothSpeed,
    snapTurnAngle,
    vignetteEnabled,
    setLocomotionMode,
    setSmoothSpeed,
    setSnapTurnAngle,
    setVignetteEnabled,
  } = useVRStore();

  if (!isSupported) return null;

  return (
    <div className="absolute top-4 right-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-gray-800/80 rounded-lg hover:bg-gray-700/80"
      >
        <Settings size={20} className="text-white" />
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-64 bg-gray-800 rounded-lg shadow-lg p-4">
          <h3 className="text-white font-medium mb-4">VR Settings</h3>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Movement</label>
            <select
              value={locomotionMode}
              onChange={(e) => setLocomotionMode(e.target.value as LocomotionMode)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
            >
              <option value="teleport">Teleport</option>
              <option value="smooth">Smooth</option>
              <option value="none">None</option>
            </select>
          </div>

          {locomotionMode === 'smooth' && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Speed: {smoothSpeed.toFixed(1)}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={smoothSpeed}
                onChange={(e) => setSmoothSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Turn Angle: {snapTurnAngle}°
            </label>
            <input
              type="range"
              min={15}
              max={90}
              step={15}
              value={snapTurnAngle}
              onChange={(e) => setSnapTurnAngle(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Comfort Vignette</label>
            <button
              onClick={() => setVignetteEnabled(!vignetteEnabled)}
              className={`w-10 h-6 rounded-full transition-colors ${
                vignetteEnabled ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  vignetteEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Create `client/src/features/vr/index.ts`:

```typescript
export { VRButton } from './VRButton';
export { VRSettings } from './VRSettings';
export { useVRStore } from '@/stores/vrStore';
```

### 5.5 Integrate VR into Scene Viewer

Update `client/src/features/scene-viewer/SceneViewer.tsx`:

```tsx
// Add to imports
import { XR, Controllers, Hands } from '@react-three/xr';
import { VRButton } from '@/features/vr/VRButton';
import { VRSettings } from '@/features/vr/VRSettings';

// Wrap Canvas content with XR
export function SceneViewer({ sceneUrl, spawnPosition, spawnRotation, onObjectSelect }: SceneViewerProps) {
  // ... existing code ...

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
        <XR>
          <Suspense fallback={null}>
            <SceneContent
              spawnPosition={spawnPosition}
              spawnRotation={spawnRotation}
              onObjectSelect={onObjectSelect}
            />
          </Suspense>

          {/* VR Controllers */}
          <Controllers />
          <Hands />
        </XR>
      </Canvas>

      {/* VR UI Overlays */}
      <VRButton />
      <VRSettings />

      {/* ... other overlays ... */}
    </div>
  );
}
```

---

## Tauri WebXR Configuration

Ensure Tauri's WebView supports WebXR. Update `src-tauri/tauri.conf.json`:

```json
{
  "app": {
    "windows": [
      {
        "webviewAttributes": {
          "allowFileAccessFromFileUrls": true
        }
      }
    ]
  }
}
```

---

## Verification Checklist

After completing Phase 5, verify:

- [ ] VR button appears when WebXR is supported
- [ ] Clicking VR button enters VR mode
- [ ] Controllers are visible and tracked
- [ ] Teleport locomotion works
- [ ] Smooth locomotion works (if selected)
- [ ] Snap turning works
- [ ] Objects can be selected with controllers
- [ ] Settings persist after restart
- [ ] Exit VR works properly

---

## Testing VR

**Without a headset:**
1. Install Chrome WebXR Emulator extension
2. Enable VR device emulation in DevTools
3. Test basic functionality

**With headset:**
1. Meta Quest with Link or Air Link
2. SteamVR with compatible headset
3. Windows Mixed Reality headsets

---

## Future: Native OpenXR (v2.0)

For v2.0, implement native OpenXR in Rust:

```rust
// Future: src-tauri/src/vr/openxr_session.rs
use openxr as xr;

pub struct OpenXRSession {
    instance: xr::Instance,
    session: xr::Session<xr::Vulkan>,
    // ...
}
```

Benefits of native OpenXR:
- Direct GPU access (no WebView overhead)
- Full feature access (foveated rendering, etc.)
- Better performance for complex scenes
- Hand tracking without WebXR limitations

---

## Next Phase

After Phase 5 is complete, proceed to **Phase 6: Cloud Sync & License** which covers:
- Optional cloud backup
- License key validation
- User account management

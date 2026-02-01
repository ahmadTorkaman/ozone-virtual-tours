# Phase 5: VR Mode

> **Estimated Scope**: WebXR integration with VR controls and UI
> **Prerequisites**: Phase 4 complete (material system working)
> **Outputs**: Full VR experience with locomotion and interaction

---

## Overview

This phase adds immersive VR support:

1. WebXR session management (enter/exit VR)
2. VR locomotion (teleport and smooth movement)
3. Controller-based interaction (ray-casting, object selection)
4. VR UI panels (floating menus for materials)
5. Comfort options (vignette, snap turning)

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer for interior designers
- **Current State**: Phase 4 complete (scene viewer + material system)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Adding WebXR VR support

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
      controller.addEventListener('squeezestart', this.onControllerSqueezeStart);
      controller.addEventListener('squeezeend', this.onControllerSqueezeEnd);
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
      this.startTeleportAim(controller);
    }

    // Check for object intersection
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

  private onControllerSqueezeStart = (_event: THREE.Event): void => {
    // Grip button - could be used for grabbing objects
  };

  private onControllerSqueezeEnd = (_event: THREE.Event): void => {
    // Release grip
  };

  private startTeleportAim(controller: THREE.XRTargetRaySpace): void {
    this.teleportMarker!.visible = true;
    this.teleportLine!.visible = true;
  }

  private updateTeleportAim(controller: THREE.XRTargetRaySpace): void {
    // Cast ray down from controller
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // Find floor intersection (simplified - assumes Y=0 is floor)
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(floorPlane, intersection)) {
      const distance = intersection.distanceTo(this.raycaster.ray.origin);

      if (distance <= this.config.teleportDistance) {
        this.teleportTarget = intersection;
        this.teleportMarker!.position.copy(intersection);
        this.teleportMarker!.position.y = 0.01; // Slightly above floor

        // Update line
        const points = [
          this.raycaster.ray.origin.clone(),
          intersection.clone(),
        ];
        this.teleportLine!.geometry.setFromPoints(points);

        // Green = valid
        (this.teleportMarker!.material as THREE.MeshBasicMaterial).color.setHex(0x00ff00);
      } else {
        // Red = too far
        (this.teleportMarker!.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
        this.teleportTarget = null;
      }
    }
  }

  private executeTeleport(): void {
    if (this.teleportTarget) {
      // Move camera group to teleport target
      const offset = new THREE.Vector3();
      offset.copy(this.camera.position);
      offset.y = 0; // Only XZ offset

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
    // Update teleport aim if active
    if (this.teleportMarker?.visible) {
      // Use right controller (index 1) for teleport
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
            // Left stick for movement
            if (source.handedness === 'left' && axes.length >= 4) {
              const moveX = axes[2];
              const moveZ = axes[3];

              if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
                const speed = this.config.smoothSpeed * 0.016; // Assuming 60fps
                const direction = new THREE.Vector3(moveX, 0, moveZ);
                direction.applyQuaternion(this.camera.quaternion);
                direction.y = 0;
                direction.normalize();

                this.cameraGroup.position.addScaledVector(direction, speed);
              }
            }

            // Right stick for turning
            if (source.handedness === 'right' && axes.length >= 4) {
              const turnX = axes[2];

              if (Math.abs(turnX) > 0.5) {
                // Snap turn
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
import { devtools } from 'zustand/middleware';
import type { LocomotionMode } from '@/engine/vr/VRControls';

interface VRState {
  // Session state
  isSupported: boolean;
  isInVR: boolean;
  isEntering: boolean;

  // Settings
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
    { name: 'vr-store' }
  )
);
```

### 5.4 Create VR Button Component

Create `client/src/features/scene-viewer/VRButton.tsx`:

```tsx
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Headset } from 'lucide-react';
import { useVRStore } from '@/stores/vrStore';
import { VRSessionManager } from '@/engine/vr/VRSession';

let vrManager: VRSessionManager | null = null;

export function VRButton() {
  const { gl } = useThree();
  const { isSupported, isInVR, isEntering, setSupported, setInVR, setEntering } = useVRStore();

  // Check VR support on mount
  useEffect(() => {
    if (!vrManager) {
      vrManager = new VRSessionManager(gl);
      vrManager.setCallbacks(
        () => setInVR(true),
        () => setInVR(false)
      );
    }

    vrManager.isSupported().then(setSupported);

    return () => {
      vrManager?.dispose();
      vrManager = null;
    };
  }, [gl, setSupported, setInVR]);

  const handleClick = async () => {
    if (!vrManager || !isSupported) return;

    if (isInVR) {
      vrManager.exitVR();
    } else {
      setEntering(true);
      try {
        await vrManager.enterVR();
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

// Non-canvas version for use outside R3F
export function VRButtonOverlay() {
  const { isSupported, isInVR, isEntering } = useVRStore();

  if (!isSupported) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4">
      <button
        disabled={isEntering}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isInVR
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        } disabled:opacity-50`}
      >
        <Headset size={20} />
        {isEntering ? 'Entering VR...' : isInVR ? 'Exit VR' : 'Enter VR'}
      </button>
    </div>
  );
}
```

### 5.5 Create VR Settings Panel

Create `client/src/features/scene-viewer/VRSettings.tsx`:

```tsx
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { useVRStore } from '@/stores/vrStore';
import type { LocomotionMode } from '@/engine/vr/VRControls';

export function VRSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    locomotionMode,
    smoothSpeed,
    snapTurnAngle,
    vignetteEnabled,
    setLocomotionMode,
    setSmoothSpeed,
    setSnapTurnAngle,
    setVignetteEnabled,
  } = useVRStore();

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

          {/* Locomotion mode */}
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

          {/* Smooth speed (only if smooth mode) */}
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

          {/* Snap turn angle */}
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

          {/* Comfort vignette */}
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

### 5.6 Integrate VR into Scene Viewer

Update `client/src/features/scene-viewer/SceneViewer.tsx` to include VR support:

```tsx
// Add to imports
import { XR, Controllers, Hands } from '@react-three/xr';
import { VRButtonOverlay } from './VRButton';
import { VRSettings } from './VRSettings';

// Update Canvas to use XR wrapper
export function SceneViewer({ sceneUrl, spawnPosition, spawnRotation, onObjectSelect }: SceneViewerProps) {
  // ... existing state and effects ...

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          xr: { enabled: true }, // Enable XR
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
      <VRButtonOverlay />
      <VRSettings />

      {/* ... other overlays ... */}
    </div>
  );
}
```

---

## VR UI Panels (In-World UI)

For material selection in VR, create floating panels:

Create `client/src/features/scene-viewer/VRMaterialPanel.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useMaterialStore } from '@/stores/materialStore';

interface VRMaterialPanelProps {
  visible: boolean;
  onSelectMaterial: (materialId: string) => void;
}

export function VRMaterialPanel({ visible, onSelectMaterial }: VRMaterialPanelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { getFilteredMaterials } = useMaterialStore();

  const materials = getFilteredMaterials().slice(0, 8); // Limit for VR

  // Position panel in front of user
  useFrame(() => {
    if (groupRef.current && visible) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();

      groupRef.current.position.copy(camera.position);
      groupRef.current.position.addScaledVector(direction, 2);
      groupRef.current.position.y = camera.position.y;
      groupRef.current.lookAt(camera.position);
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Panel background */}
      <RoundedBox args={[1.2, 0.8, 0.05]} radius={0.02}>
        <meshStandardMaterial color="#1f2937" transparent opacity={0.9} />
      </RoundedBox>

      {/* Title */}
      <Text
        position={[0, 0.3, 0.03]}
        fontSize={0.06}
        color="white"
        anchorX="center"
      >
        Materials
      </Text>

      {/* Material buttons */}
      {materials.map((material, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = (col - 1.5) * 0.25;
        const y = 0.1 - row * 0.25;

        return (
          <group key={material.id} position={[x, y, 0.03]}>
            <mesh
              onClick={() => onSelectMaterial(material.id)}
              onPointerOver={(e) => {
                (e.object as THREE.Mesh).scale.setScalar(1.1);
              }}
              onPointerOut={(e) => {
                (e.object as THREE.Mesh).scale.setScalar(1);
              }}
            >
              <boxGeometry args={[0.2, 0.2, 0.02]} />
              <meshPhysicalMaterial
                color={material.color || '#888888'}
                metalness={material.metalness}
                roughness={material.roughness}
              />
            </mesh>
            <Text
              position={[0, -0.13, 0]}
              fontSize={0.025}
              color="white"
              anchorX="center"
              maxWidth={0.2}
            >
              {material.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
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
- [ ] Material panel appears in VR
- [ ] Exit VR works properly

---

## Testing VR

To test without a headset:

1. Install Chrome WebXR Emulator extension
2. Enable VR device emulation in DevTools
3. Test basic functionality

For real testing:
1. Use Meta Quest with Link or Air Link
2. Use SteamVR with compatible headset
3. Test on Quest browser for standalone

---

## Next Phase

After Phase 5 is complete, proceed to **Phase 6: PWA & Offline** which covers:
- Service worker setup
- IndexedDB storage
- Offline capability
- Background sync

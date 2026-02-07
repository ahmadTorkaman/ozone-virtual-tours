import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { Glasses, Lock } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { loadGLB, disposeScene } from '@/engine/SceneManager';
import { LoadingOverlay } from './LoadingOverlay';
import { ControlsHelp } from './ControlsHelp';
import { SelectionOutline } from './SelectionOutline';
import { VRManager, VRSettings } from '@/features/vr';
import { useVRStore } from '@/stores/vrStore';
import { useLicenseStore } from '@/stores/licenseStore';

// Create XR store for managing VR session
const xrStore = createXRStore();

interface SceneViewerProps {
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
    setPointerLocked,
    reset,
  } = useSceneStore();

  const [showHelp, setShowHelp] = useState(true);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

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
  }, [sceneUrl, setLoading, setLoadProgress, setError, setSceneData, reset]);

  // Hide help after pointer lock
  useEffect(() => {
    if (isPointerLocked) {
      const timer = setTimeout(() => setShowHelp(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isPointerLocked]);

  // Handle pointer lock changes
  useEffect(() => {
    const handlePointerLockChange = () => {
      const canvas = canvasContainerRef.current?.querySelector('canvas');
      setPointerLocked(document.pointerLockElement === canvas);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [setPointerLocked]);

  // Request pointer lock on canvas click
  const handleCanvasClick = useCallback(() => {
    if (!isPointerLocked) {
      const canvas = canvasContainerRef.current?.querySelector('canvas');
      canvas?.requestPointerLock();
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

  const { isSupported: vrSupported, isInVR } = useVRStore();
  const { status: licenseStatus } = useLicenseStore();
  const canUseVR = licenseStatus?.canUseVr ?? false;
  const [showVRUpgradePrompt, setShowVRUpgradePrompt] = useState(false);

  const handleEnterVR = async () => {
    if (!canUseVR) {
      setShowVRUpgradePrompt(true);
      return;
    }
    try {
      await xrStore.enterVR();
    } catch (error) {
      console.error('Failed to enter VR:', error);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Canvas container - clicking here activates pointer lock */}
      <div
        ref={canvasContainerRef}
        className="w-full h-full"
        onClick={handleCanvasClick}
      >
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
          <XR store={xrStore}>
            <Suspense fallback={null}>
              <SceneContent
                spawnRotation={spawnRotation}
                onObjectSelect={onObjectSelect}
              />
            </Suspense>
          </XR>
        </Canvas>
      </div>

      {/* UI Overlays - stop propagation to prevent pointer lock */}
      {isLoading && (
        <div
          className="absolute inset-0 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <LoadingOverlay progress={loadProgress} />
        </div>
      )}

      {showHelp && !isLoading && (
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
        >
          <ControlsHelp />
        </div>
      )}

      {/* VR Controls */}
      {vrSupported && !isLoading && (
        <div onClick={(e) => e.stopPropagation()}>
          {canUseVR && <VRSettings className="absolute top-4 right-4" />}
          <button
            onClick={handleEnterVR}
            disabled={isInVR}
            className={`absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !canUseVR
                ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                : isInVR
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {!canUseVR ? <Lock size={20} /> : <Glasses size={20} />}
            {!canUseVR ? 'VR (Pro)' : isInVR ? 'In VR' : 'Enter VR'}
          </button>
        </div>
      )}

      {/* VR Upgrade Modal */}
      {showVRUpgradePrompt && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Glasses size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">VR Mode</h3>
            </div>
            <p className="text-gray-300 mb-4">
              VR mode is available with a Professional or Enterprise license.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowVRUpgradePrompt(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowVRUpgradePrompt(false);
                  window.location.href = '/settings';
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dev stats */}
      {import.meta.env.DEV && (
        <div className="absolute top-0 left-0 pointer-events-none">
          <Stats />
        </div>
      )}
    </div>
  );
}

interface SceneContentProps {
  spawnRotation: { x: number; y: number; z: number };
  onObjectSelect?: (objectName: string | null) => void;
}

function SceneContent({ spawnRotation, onObjectSelect }: SceneContentProps) {
  const { camera, gl } = useThree();
  const cameraGroupRef = useRef<THREE.Group>(null);
  const { sceneData, isPointerLocked, setSelectedObject, setHoveredObject } =
    useSceneStore();
  const { isInVR, setSupported } = useVRStore();

  // Camera rotation state (euler angles)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isInitialized = useRef(false);

  // Movement keys state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const moveSpeed = 5;
  const lookSpeed = 0.002;

  // Check VR support
  useEffect(() => {
    async function checkSupport() {
      if (navigator.xr) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-vr');
          setSupported(supported);
        } catch {
          setSupported(false);
        }
      } else {
        setSupported(false);
      }
    }
    checkSupport();
  }, [setSupported]);

  // Initialize camera rotation once
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      euler.current.set(spawnRotation.x, spawnRotation.y, spawnRotation.z, 'YXZ');
      camera.quaternion.setFromEuler(euler.current);
    }
  }, [camera, spawnRotation]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.up = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.down = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.up = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.down = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Mouse look controls
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked || isInVR) return;

      euler.current.y -= e.movementX * lookSpeed;
      euler.current.x -= e.movementY * lookSpeed;
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));

      camera.quaternion.setFromEuler(euler.current);
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [camera, isPointerLocked, isInVR]);

  // Movement update
  useFrame((_, delta) => {
    if (isInVR || !isPointerLocked) return;

    const k = keys.current;
    const speed = moveSpeed * delta;

    // Get camera direction on horizontal plane
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    // Apply movement
    if (k.forward) camera.position.addScaledVector(forward, speed);
    if (k.backward) camera.position.addScaledVector(forward, -speed);
    if (k.left) camera.position.addScaledVector(right, -speed);
    if (k.right) camera.position.addScaledVector(right, speed);
    if (k.up) camera.position.y += speed;
    if (k.down) camera.position.y -= speed;
  });

  // Handle object click
  const handleClick = (event: { object: THREE.Object3D; stopPropagation: () => void }) => {
    if (isInVR || !isPointerLocked) return;
    event.stopPropagation();

    if (event.object instanceof THREE.Mesh) {
      setSelectedObject(event.object.name);
      onObjectSelect?.(event.object.name);
    }
  };

  const handleVRObjectSelect = (objectName: string) => {
    setSelectedObject(objectName);
    onObjectSelect?.(objectName);
  };

  const handlePointerOver = (event: { object: THREE.Object3D; stopPropagation: () => void }) => {
    if (isInVR) return;
    event.stopPropagation();
    if (event.object instanceof THREE.Mesh) {
      setHoveredObject(event.object.name);
      gl.domElement.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    if (isInVR) return;
    setHoveredObject(null);
    gl.domElement.style.cursor = 'default';
  };

  if (!sceneData) return null;

  return (
    <>
      {/* Camera group for VR */}
      <group ref={cameraGroupRef}>
        {cameraGroupRef.current && (
          <VRManager
            cameraGroup={cameraGroupRef.current}
            onObjectSelect={handleVRObjectSelect}
          />
        )}
      </group>

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
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />

      {/* Scene */}
      <primitive
        object={sceneData.scene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      <SelectionOutline />
    </>
  );
}

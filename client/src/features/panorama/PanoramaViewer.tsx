import { useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePanoramaStore } from '@/stores/panoramaStore';
import { HotspotMarker } from './HotspotMarker';

interface PanoramaViewerProps {
  imageUrl: string;
  initialYaw?: number;
  initialPitch?: number;
  onHotspotClick?: (hotspotId: string) => void;
}

export function PanoramaViewer({
  imageUrl,
  initialYaw = 0,
  initialPitch = 0,
  onHotspotClick,
}: PanoramaViewerProps) {
  const { hotspots, isTransitioning, setLoading, setCamera } = usePanoramaStore();

  // Set initial camera position
  useEffect(() => {
    setCamera(initialYaw, initialPitch);
  }, [initialYaw, initialPitch, setCamera]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 0.1] }}
        gl={{ antialias: true }}
      >
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

      {/* Transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 pointer-events-none" />
      )}
    </div>
  );
}

interface PanoramaSphereProps {
  imageUrl: string;
  onLoad?: () => void;
}

function PanoramaSphere({ imageUrl, onLoad }: PanoramaSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { setLoading } = usePanoramaStore();
  const textureRef = useRef<THREE.Texture | null>(null);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    setLoading(true);
    const loader = new THREE.TextureLoader();

    loader.load(
      imageUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        if (meshRef.current) {
          const material = meshRef.current.material as THREE.MeshBasicMaterial;
          // Dispose old texture if exists
          if (textureRef.current) {
            textureRef.current.dispose();
          }
          textureRef.current = texture;
          material.map = texture;
          material.needsUpdate = true;
        }

        onLoadRef.current?.();
      },
      undefined,
      (error) => {
        console.error('Failed to load panorama:', error);
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [imageUrl]); // Only re-run when imageUrl changes

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial side={THREE.BackSide} />
    </mesh>
  );
}

function PanoramaControls() {
  const { camera, gl } = useThree();
  const { yaw, pitch, fov, setCamera } = usePanoramaStore();

  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ yaw, pitch });
  const targetFov = useRef(fov);

  // Sync store state to local ref
  useEffect(() => {
    targetRotation.current = { yaw, pitch };
    targetFov.current = fov;
  }, [yaw, pitch, fov]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: PointerEvent) => {
    isDragging.current = true;
    prevMouse.current = { x: e.clientX, y: e.clientY };
    gl.domElement.setPointerCapture(e.pointerId);
    gl.domElement.style.cursor = 'grabbing';
  }, [gl.domElement]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - prevMouse.current.x;
    const deltaY = e.clientY - prevMouse.current.y;

    // Adjust sensitivity based on FOV
    const sensitivity = 0.2 * (targetFov.current / 75);

    targetRotation.current.yaw -= deltaX * sensitivity;
    targetRotation.current.pitch = Math.max(
      -85,
      Math.min(85, targetRotation.current.pitch + deltaY * sensitivity)
    );

    prevMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    isDragging.current = false;
    gl.domElement.releasePointerCapture(e.pointerId);
    gl.domElement.style.cursor = 'grab';
    setCamera(targetRotation.current.yaw, targetRotation.current.pitch);
  }, [gl.domElement, setCamera]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * 0.05;
    const newFov = Math.max(30, Math.min(100, targetFov.current + delta));
    targetFov.current = newFov;
    (camera as THREE.PerspectiveCamera).fov = newFov;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    setCamera(targetRotation.current.yaw, targetRotation.current.pitch, newFov);
  }, [camera, setCamera]);

  // Touch handlers for mobile
  const touchStartRef = useRef<{ x: number; y: number; distance?: number }>({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.distance = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      const sensitivity = 0.3 * (targetFov.current / 75);

      targetRotation.current.yaw -= deltaX * sensitivity;
      targetRotation.current.pitch = Math.max(
        -85,
        Math.min(85, targetRotation.current.pitch + deltaY * sensitivity)
      );

      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchStartRef.current.distance) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = (touchStartRef.current.distance - distance) * 0.1;

      const newFov = Math.max(30, Math.min(100, targetFov.current + delta));
      targetFov.current = newFov;
      (camera as THREE.PerspectiveCamera).fov = newFov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

      touchStartRef.current.distance = distance;
    }
  }, [camera]);

  const handleTouchEnd = useCallback(() => {
    setCamera(targetRotation.current.yaw, targetRotation.current.pitch, targetFov.current);
  }, [setCamera]);

  // Setup event listeners
  useEffect(() => {
    const domElement = gl.domElement;
    domElement.style.cursor = 'grab';

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointerleave', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    domElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointerleave', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    gl.domElement,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Update camera look direction each frame
  useFrame(() => {
    const { yaw, pitch } = targetRotation.current;

    // Convert spherical to cartesian
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
